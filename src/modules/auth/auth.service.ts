import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import * as bcrypt from 'bcrypt';
import { AuthDto } from './dto/auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ConfigService } from '@nestjs/config';
import { Users } from '../users/schemas/users.schema';
import { MailerService } from '../mailer/mailer.service';
import { WalletsService } from '../wallets/wallets.service';
import { otpEmailTemplate } from '../mailer/templates/otp-email.template';
import { MailerDto } from '../mailer/dto/mailer.dto';
import { otpForgotPasswordTemplate } from '../mailer/templates/otp-forgot-password.template';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Users.name) private usersModel: Model<Users>,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private configService: ConfigService,
    private walletsService: WalletsService,
  ) {}

  // Register
  async register(authDto: AuthDto): Promise<APIResponseDto> {
    if (
      !authDto.name ||
      !authDto.email ||
      !authDto.password ||
      !authDto.confirmPassword
    ) {
      throw new HttpException(
        'All fields are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const existingUser = await this.usersModel.findOne({
      email: authDto.email,
    });
    if (existingUser) {
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
    }
    if (authDto.password !== authDto.confirmPassword) {
      throw new HttpException('Passwords do not match', HttpStatus.BAD_REQUEST);
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

    const html = otpEmailTemplate(authDto.name, otpCode);
    const mailer: MailerDto = {
      to: [{ name: authDto.name, address: authDto.email }],
      subject: 'Account Verification OTP',
      html,
    };
    await this.mailerService.sendMail(mailer);

    const createdUser = new this.usersModel(authDto);
    createdUser.otpCode = otpCode;
    createdUser.otpExpires = otpExpires;
    await createdUser.save();
    return {
      statusCode: HttpStatus.CREATED,
      message: 'User registered successfully, check your email for OTP code',
      data: createdUser,
    };
  }
  // Login
  async login(email: string, password: string): Promise<APIResponseDto> {
    if (!email || !password) {
      throw new HttpException(
        'Email and password are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const user = await this.usersModel.findOne({ email });
    if (!user) {
      throw new HttpException(
        'Invalid email or password',
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
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }
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

    const { password: _, ...userWithoutPassword } = user.toObject();

    return {
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: userWithoutPassword,
      },
    };
  }

  // Active account
  async activeAccount(email: string, otpCode: string): Promise<APIResponseDto> {
    const user = await this.usersModel.findOne({ email, otpCode });
    if (!user) {
      throw new HttpException(
        'Invalid OTP code or email',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (!user.otpExpires || user.otpExpires < new Date()) {
      throw new HttpException('OTP code expired', HttpStatus.UNAUTHORIZED);
    }
    user.isActive = true;
    user.otpCode = '';
    user.otpExpires = new Date(0);
    await user.save();
    await this.walletsService.create({
      userId: user._id.toString(),
      balance: 0,
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Account activated successfully',
    };
  }

  // Resend OTP
  async resendOtp(email: string): Promise<APIResponseDto> {
    const user = await this.usersModel.findOne({ email });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const otpCode = (
      (parseInt(crypto.randomBytes(3).toString('hex'), 16) % 900000) +
      100000
    ).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    user.otpCode = otpCode;
    user.otpExpires = otpExpires;
    await user.save();
    const html = otpEmailTemplate(user.name, otpCode);
    const mailer: MailerDto = {
      to: [{ name: user.name, address: user.email }],
      subject: 'Account Verification OTP',
      html,
    };
    await this.mailerService.sendMail(mailer);
    return {
      statusCode: 200,
      message: 'OTP resent successfully',
    };
  }

  // Forgot password - send OTP
  async sendMailForgotPassword(email: string): Promise<APIResponseDto> {
    const user = await this.usersModel.findOne({ email });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    // Generate secure 6-digit OTP using crypto
    const otpCode = (
      (parseInt(crypto.randomBytes(3).toString('hex'), 16) % 900000) +
      100000
    ).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    user.otpCode = otpCode;
    user.otpExpires = otpExpires;
    await user.save();
    const html = otpForgotPasswordTemplate(user.name, otpCode);
    const mailer: MailerDto = {
      to: [{ name: user.name, address: user.email }],
      subject: 'Password Reset OTP',
      html,
    };
    await this.mailerService.sendMail(mailer);
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
    const user = await this.usersModel.findOne({ email });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
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
    await user.save();
    return {
      statusCode: 200,
      message: 'Password reset successfully',
    };
  }

  // Change password
  async changePassword(
    changePasswordDto: ChangePasswordDto,
    userPayload: { userId: string; role: string },
  ): Promise<APIResponseDto> {
    console.log(userPayload);
    const user = await this.usersModel.findOne({ _id: userPayload.userId });
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
    await user.save();
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
        const newUser = new this.usersModel({
          name: `${req.user.firstName} ${req.user.lastName}`,
          email: req.user.email,
          avatar: req.user.picture,
          phone: '',
          isActive: true,
          password: crypto.randomBytes(16).toString('hex'),
        });
        await newUser.save();
        await this.walletsService.create({
          userId: newUser._id.toString(),
          balance: 0,
        });
        req.user = newUser;
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
    } catch (error) {
      console.error(error.message);
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
