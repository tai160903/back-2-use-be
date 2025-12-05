import { Customers } from './../users/schemas/customer.schema';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import * as bcrypt from 'bcrypt';
import { AuthDto } from './dto/auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ConfigService } from '@nestjs/config';
import { Users } from '../users/schemas/users.schema';
import { MailerService } from 'src/infrastructure/mailer/mailer.service';
import { WalletsService } from '../wallets/wallets.service';
import { otpEmailTemplate } from 'src/infrastructure/mailer/templates/otp-email.template';
import { otpForgotPasswordTemplate } from 'src/infrastructure/mailer/templates/otp-forgot-password.template';
import { MailerDto } from 'src/infrastructure/mailer/dto/mailer.dto';
import { BusinessSubscriptions } from '../businesses/schemas/business-subscriptions.schema';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { Businesses } from '../businesses/schemas/businesses.schema';
import { Staff } from '../staffs/schemas/staffs.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Users.name) private usersModel: Model<Users>,
    @InjectModel(Customers.name) private customersModel: Model<Customers>,
    @InjectModel(BusinessSubscriptions.name)
    private businessSubscriptionModel: Model<BusinessSubscriptions>,
    @InjectModel(Businesses.name)
    private businessModel: Model<Businesses>,
    @InjectModel(Staff.name) private staffModel: Model<Staff>,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private configService: ConfigService,
    private walletsService: WalletsService,
  ) {}

  // Register
  async register(authDto: AuthDto): Promise<APIResponseDto> {
    try {
      if (
        !authDto.username ||
        !authDto.email ||
        !authDto.password ||
        !authDto.confirmPassword
      ) {
        throw new HttpException(
          'All fields are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      authDto.username = authDto.username.toLowerCase().trim();
      authDto.email = authDto.email.toLowerCase().trim();
      authDto.password = authDto.password.trim();
      authDto.confirmPassword = authDto.confirmPassword.trim();

      const existingUsername = await this.usersModel
        .findOne({
          username: authDto.username,
        })
        .select('+password');

      if (existingUsername) {
        throw new HttpException(
          'Username already exists',
          HttpStatus.BAD_REQUEST,
        );
      }

      const existingUser = await this.usersModel
        .findOne({ email: authDto.email })
        .select('+password');
      if (existingUser) {
        throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
      }

      if (authDto.password !== authDto.confirmPassword) {
        throw new HttpException(
          'Passwords do not match',
          HttpStatus.BAD_REQUEST,
        );
      }

      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(authDto.password, salt);
      authDto.password = hashedPassword;
      delete authDto.confirmPassword;

      const otpCode = (
        (parseInt(crypto.randomBytes(3).toString('hex'), 16) % 900000) +
        100000
      ).toString();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

      let createdUser: any;
      try {
        createdUser = new this.usersModel({
          username: authDto.username,
          email: authDto.email,
          password: authDto.password,
          otpCode,
          otpExpires,
        });

        await createdUser.save();
      } catch (error: any) {
        throw new HttpException(
          error.message || 'Failed to create user',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      try {
        const customer = new this.customersModel({
          userId: createdUser._id,
        });

        await customer.save();
      } catch (error: any) {
        throw new HttpException(
          error.message || 'Failed to create customer',
          error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      const html = otpEmailTemplate(authDto.username, otpCode);
      const mailer: MailerDto = {
        to: [{ name: authDto.username, address: authDto.email }],
        subject: 'Account Verification OTP',
        html,
      };
      try {
        const mailResult = await this.mailerService.sendMail(mailer);
        if (!mailResult) {
          throw new HttpException(
            'Failed to send verification email',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      } catch (error: any) {
        throw new HttpException(
          error?.message || 'Failed to send verification email',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      const userResponse: any = {
        username: createdUser.username,
        email: createdUser.email,
      };
      return {
        statusCode: HttpStatus.CREATED,
        message: 'User registered successfully, check your email for OTP code',
        data: userResponse,
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  // Login
  async login(username: string, password: string): Promise<APIResponseDto> {
    if (!username || !password) {
      throw new HttpException(
        'Username and password are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (username.length < 6 || username.length > 20) {
      throw new HttpException(
        'Username must be between 6 and 20 characters',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!username.match(/^(?![_.-])(?!.*[_.-]{2})[a-zA-Z0-9._-]+(?<![_.-])$/)) {
      throw new HttpException(
        'Use only letters, numbers, dots, hyphens, or underscores; cannot start/end with a special character or have two special characters in a row.',
        HttpStatus.BAD_REQUEST,
      );
    }
    username = username.toLowerCase().trim();
    password = password.trim();

    const user = await this.usersModel
      .findOne({ username })
      .select('+password');
    if (!user) {
      throw new HttpException(
        'Invalid username or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!user.isActive) {
      throw new HttpException('Account is not active', HttpStatus.UNAUTHORIZED);
    }

    if (user.isBlocked) {
      throw new HttpException('Account is blocked', HttpStatus.UNAUTHORIZED);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new HttpException(
        'Invalid username or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Filter roles to only include CUSTOMER and STAFF for login
    const loginRoles: RolesEnum[] = [];

    if (user.role.includes(RolesEnum.STAFF)) {
      const staff = await this.staffModel.findOne({
        userId: new Types.ObjectId(user._id),
        status: 'active',
      });
      if (!staff) {
        throw new HttpException(
          'Staff account not found',
          HttpStatus.FORBIDDEN,
        );
      }
      loginRoles.push(RolesEnum.STAFF);
    }

    if (user.role.includes(RolesEnum.CUSTOMER)) {
      const customer = await this.customersModel.findOne({
        userId: new Types.ObjectId(user._id),
      });
      if (!customer) {
        throw new HttpException(
          'Customer account not found',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      loginRoles.push(RolesEnum.CUSTOMER);
    }

    // If user has no CUSTOMER or STAFF role, default to CUSTOMER
    if (loginRoles.length === 0) {
      loginRoles.push(RolesEnum.CUSTOMER);
    }

    const payload = { _id: user._id, role: loginRoles };
    let accessToken: string;
    let refreshToken: string;
    try {
      accessToken = await this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.accessToken.secret'),
        expiresIn: this.configService.get(
          'jwt.accessToken.signOptions.expiresIn',
        ),
      });
      refreshToken = await this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshToken.secret'),
        expiresIn: this.configService.get(
          'jwt.refreshToken.signOptions.expiresIn',
        ),
      });
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to generate tokens',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: loginRoles,
        },
      },
    };
  }

  async switchRole(userId: string, targetRole: 'customer' | 'business') {
    const user = await this.usersModel.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const roleEnum = targetRole === 'business' ? RolesEnum.BUSINESS : RolesEnum.CUSTOMER;

    // Check if role already exists
    if (user.role.includes(roleEnum)) {
      throw new HttpException(
        `User already has ${targetRole} role`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (targetRole === 'business') {
      const business = await this.businessModel.findOne({
        userId: new Types.ObjectId(user._id),
      });
      if (!business) {
        throw new HttpException(
          'Business account not found',
          HttpStatus.NOT_FOUND,
        );
      }
    } else if (targetRole === 'customer') {
      const customer = await this.customersModel.findOne({
        userId: new Types.ObjectId(user._id),
      });
      if (!customer) {
        throw new HttpException(
          'Customer account not found',
          HttpStatus.NOT_FOUND,
        );
      }
    } else {
      throw new HttpException('Invalid role', HttpStatus.BAD_REQUEST);
    }

    // Add role to user's role array
    user.role.push(roleEnum);
    await user.save();

    const payload = { _id: user._id, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('jwt.accessToken.secret'),
      expiresIn: this.configService.get(
        'jwt.accessToken.signOptions.expiresIn',
      ),
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('jwt.refreshToken.secret'),
      expiresIn: this.configService.get(
        'jwt.refreshToken.signOptions.expiresIn',
      ),
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Role switched successfully',
      data: {
        accessToken,
        refreshToken,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: targetRole,
        },
      },
    };
  }

  // Active account
  async activeAccount(email: string, otpCode: string): Promise<APIResponseDto> {
    try {
      if (!email || !otpCode) {
        throw new HttpException(
          'Email and OTP code are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      email = email.toLowerCase().trim();
      otpCode = otpCode.trim();

      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new HttpException('Invalid email format', HttpStatus.BAD_REQUEST);
      }

      if (!otpCode.match(/^\d{6}$/)) {
        throw new HttpException(
          'OTP code must be a 6-digit number',
          HttpStatus.BAD_REQUEST,
        );
      }

      const user = await this.usersModel.findOne({ email, otpCode });
      if (!user) {
        throw new HttpException(
          'Invalid OTP code or email',
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (user.isActive) {
        throw new HttpException('Account is already active', HttpStatus.OK);
      }

      if (!user.otpExpires || user.otpExpires < new Date()) {
        throw new HttpException('OTP code expired', HttpStatus.UNAUTHORIZED);
      }

      try {
        await this.walletsService.create({
          userId: user._id.toString(),
          type: 'customer',
          availableBalance: 0,
          holdingBalance: 0,
        });
      } catch (error: any) {
        throw new HttpException(
          error.message || 'Failed to create wallet',
          error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      user.isActive = true;
      user.otpCode = '';

      user.otpCode = '';
      user.otpExpires = new Date(0);
      await user.save();

      return {
        statusCode: HttpStatus.OK,
        message: 'Account activated successfully',
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Resend OTP
  async resendOtp(email: string): Promise<APIResponseDto> {
    try {
      if (!email) {
        throw new HttpException('Email is required', HttpStatus.BAD_REQUEST);
      }

      email = email.toLowerCase().trim();

      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new HttpException('Invalid email format', HttpStatus.BAD_REQUEST);
      }

      const user = await this.usersModel.findOne({ email });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const customer = await this.customersModel.findOne({
        userId: new Types.ObjectId(user._id),
      });

      if (!customer) {
        throw new HttpException(
          'Customer not found',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const randomNumber = parseInt(crypto.randomBytes(3).toString('hex'), 16);
      const otpCode = ((randomNumber % 900000) + 100000).toString();

      const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
      user.otpCode = otpCode;
      user.otpExpires = otpExpires;
      try {
        await user.save();
      } catch (error: any) {
        throw new HttpException(
          error.message || 'Failed to save user',
          error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      const html = otpEmailTemplate(customer?.fullName, otpCode);
      const mailer: MailerDto = {
        to: [{ name: customer?.fullName, address: user.email }],
        subject: 'Account Verification OTP',
        html,
      };

      await this.mailerService.sendMail(mailer).catch((error) => {
        throw new HttpException(
          error.message || 'Failed to send verification email',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'OTP resent successfully',
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Forgot password - send OTP
  async sendMailForgotPassword(email: string): Promise<APIResponseDto> {
    const user = await this.usersModel.findOne({ email });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const customer = await this.customersModel.findOne({
      userId: new Types.ObjectId(user._id),
    });
    if (!customer) {
      throw new HttpException(
        'Customer not found',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    // Generate secure 6-digit OTP using crypto
    const otpCode = (
      (parseInt(crypto.randomBytes(3).toString('hex'), 16) % 900000) +
      100000
    ).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    user.otpCode = otpCode;
    user.otpExpires = otpExpires;
    try {
      await user.save();
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to save user',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const html = otpForgotPasswordTemplate(customer?.fullName, otpCode);
    const mailer: MailerDto = {
      to: [{ name: customer?.fullName, address: user.email }],
      subject: 'Password Reset OTP',
      html,
    };
    try {
      const mailResult = await this.mailerService.sendMail(mailer);
      if (!mailResult) {
        throw new HttpException(
          'Failed to send password reset email',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to send password reset email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return {
      statusCode: 200,
      message: 'OTP for password reset sent to email',
    };
  }

  // Verify OTP and reset password
  async verifyOtpAndResetPassword(
    email: string,
    otp: string,
    newPassword: string,
    confirmNewPassword: string,
  ): Promise<APIResponseDto> {
    if (!email || !otp || !newPassword || !confirmNewPassword) {
      throw new HttpException(
        'All fields are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const user = await this.usersModel.findOne({ email }).select('+password');
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    if (!otp.match(/^\d{6}$/)) {
      throw new HttpException(
        'OTP code must be a 6-digit number',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (user.otpCode !== otp) {
      throw new HttpException('Invalid OTP code', HttpStatus.UNAUTHORIZED);
    }
    if (!user.otpExpires || user.otpExpires < new Date()) {
      throw new HttpException('OTP code expired', HttpStatus.UNAUTHORIZED);
    }
    if (newPassword !== confirmNewPassword) {
      throw new HttpException('Passwords do not match', HttpStatus.BAD_REQUEST);
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    user.otpCode = '';
    user.otpExpires = new Date(0);
    if (!user.isActive) {
      user.isActive = true;
    }
    try {
      await user.save();
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to reset password',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return {
      statusCode: 200,
      message: 'Password reset successfully',
    };
  }

  // Change password
  async changePassword(
    changePasswordDto: ChangePasswordDto,
    userPayload: { _id: string; role: string },
  ): Promise<APIResponseDto> {
    const user = await this.usersModel
      .findOne({ _id: userPayload._id })
      .select('+password');
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    if (
      changePasswordDto.newPassword !== changePasswordDto.confirmNewPassword
    ) {
      throw new HttpException(
        'New passwords do not match',
        HttpStatus.BAD_REQUEST,
      );
    }
    const isMatch = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.password,
    );
    if (!isMatch) {
      throw new HttpException('Invalid old password', HttpStatus.UNAUTHORIZED);
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      salt,
    );
    user.password = hashedPassword;
    try {
      await user.save();
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to save user',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return {
      statusCode: HttpStatus.OK,
      message: 'Password changed successfully',
      data: user,
    };
  }

  // Google OAuth2 login
  async googleLogin(req: { user: any }): Promise<APIResponseDto> {
    try {
      if (!req.user) {
        throw new HttpException('No user from google', HttpStatus.UNAUTHORIZED);
      }

      const user = await this.usersModel.findOne({ email: req.user.email });
      if (!user) {
        let newUser;
        try {
          newUser = new this.usersModel({
            name: `${req.user.firstName} ${req.user.lastName}`,
            email: req.user.email,
            avatar: req.user.picture,
            phone: '',
            isActive: true,
            password: crypto.randomBytes(16).toString('hex'),
          });
          await newUser.save();
        } catch (error: any) {
          throw new HttpException(
            error.message || 'Failed to create user',
            error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        try {
          await this.walletsService.create({
            userId: newUser._id.toString(),
            type: 'customer',
            availableBalance: 0,
            holdingBalance: 0,
          });
        } catch (error: any) {
          throw new HttpException(
            error.message || 'Failed to create wallet',
            error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        req.user = newUser;

        try {
          await new this.customersModel({
            userId: newUser._id,
          }).save();
        } catch (error: any) {
          throw new HttpException(
            error.message || 'Failed to create customer',
            error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      } else {
        req.user = user;
      }

      const payload = { _id: req.user._id, role: req.user.role };
      const accessToken = await this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.accessToken.secret'),
        expiresIn: this.configService.get(
          'jwt.accessToken.signOptions.expiresIn',
        ),
      });
      const refreshToken = await this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshToken.secret'),
        expiresIn: this.configService.get(
          'jwt.refreshToken.signOptions.expiresIn',
        ),
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Login successful',
        data: {
          accessToken,
          refreshToken,
          user: req.user,
        },
      };
    } catch (error: any) {
      console.error(error.message);
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<APIResponseDto> {
    try {
      if (!refreshToken) {
        throw new HttpException(
          'Refresh token is required',
          HttpStatus.BAD_REQUEST,
        );
      }
      const decoded = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('jwt.refreshToken.secret'),
      });
      if (!decoded || !decoded._id) {
        throw new HttpException(
          'Invalid refresh token',
          HttpStatus.UNAUTHORIZED,
        );
      }
      const user = await this.usersModel.findById(decoded._id);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      const payload = { _id: user._id, role: user.role };
      const newAccessToken = await this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.accessToken.secret'),
        expiresIn: this.configService.get(
          'jwt.accessToken.signOptions.expiresIn',
        ),
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Access token refreshed successfully',
        data: {
          accessToken: newAccessToken,
        },
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Something went wrong',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
