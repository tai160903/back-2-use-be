import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthDto } from './dto/auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Users } from 'src/users/schemas/users.schema';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from 'src/mailer/mailer.service';
import { forgotPasswordTemplate } from '../mailer/templates/forgot-password.template';
import * as crypto from 'crypto';
import { activeAccountTemplate } from 'src/mailer/templates/active-account.template';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Users.name) private usersModel: Model<Users>,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  // Register
  async register(authDto: AuthDto) {
    if (
      !authDto.name ||
      !authDto.email ||
      !authDto.password ||
      !authDto.confirmPassword ||
      !authDto.phone
    ) {
      throw new HttpException(
        { message: 'All fields are required' },
        HttpStatus.BAD_REQUEST,
      );
    }
    const existingUser = await this.usersModel.findOne({
      email: authDto.email,
    });
    if (existingUser) {
      throw new HttpException(
        { message: 'Email already exists' },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (authDto.password !== authDto.confirmPassword) {
      throw new HttpException(
        { message: 'Passwords do not match' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(authDto.password, salt);
    authDto.password = hashedPassword;
    delete authDto.confirmPassword;

    const verificationToken = crypto.randomBytes(16).toString('hex');
    const activelink = `http://localhost:5173/active-account?token=${verificationToken}`;
    const html = activeAccountTemplate(authDto.name, activelink);
    await this.mailerService.sendMail({
      to: [{ name: authDto.name, address: authDto.email }],
      subject: 'Account Verification',
      html,
    });

    const createdUser = new this.usersModel(authDto);
    createdUser.verificationToken = verificationToken;
    await createdUser.save();
    return {
      statusCode: HttpStatus.CREATED,
      message:
        'User registered successfully, check your email for verification',
      data: createdUser,
    };
  }

  // Login
  async login(email: string, password: string) {
    if (!email || !password) {
      throw new HttpException(
        { message: 'Email and password are required' },
        HttpStatus.BAD_REQUEST,
      );
    }
    const user = await this.usersModel.findOne({ email });
    if (!user) {
      throw new HttpException(
        { message: 'Invalid email or password' },
        HttpStatus.UNAUTHORIZED,
      );
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new HttpException(
        { message: 'Invalid email or password' },
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
    return {
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data: {
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: user,
      },
    };
  }

  // Active account
  async activeAccount(token: string) {
    const user = await this.usersModel.findOne({ verificationToken: token });
    if (!user) {
      throw new HttpException(
        { message: 'Invalid token' },
        HttpStatus.UNAUTHORIZED,
      );
    }
    user.isActive = true;
    user.verificationToken = '';
    await user.save();
    return {
      statusCode: HttpStatus.OK,
      message: 'Account activated successfully',
    };
  }

  // Forgot password
  async sendMailForgotPassword(email: string) {
    const user = await this.usersModel.findOne({ email });
    if (!user) {
      throw new HttpException(
        { message: 'User not found' },
        HttpStatus.NOT_FOUND,
      );
    }
    const token = crypto.randomBytes(16).toString('hex');
    user.resetToken = token;
    await user.save();
    const resetLink = `http://localhost:5173/auth/reset-password?token=${token}`;
    const html = forgotPasswordTemplate(user.name, resetLink);
    await this.mailerService.sendMail({
      to: [{ name: user.name, address: user.email }],
      subject: 'Password Reset',
      html,
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Password reset instructions sent to email',
    };
  }

  // Change password
  async changePassword(changePasswordDto: ChangePasswordDto, userPayload: any) {
    const user = await this.usersModel.findOne({ _id: userPayload._id });
    if (!user) {
      throw new HttpException(
        { message: 'User not found' },
        HttpStatus.NOT_FOUND,
      );
    }
    if (
      changePasswordDto.newPassword !== changePasswordDto.confirmNewPassword
    ) {
      throw new HttpException(
        { message: 'New passwords do not match' },
        HttpStatus.BAD_REQUEST,
      );
    }
    const isMatch = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.password,
    );
    if (!isMatch) {
      throw new HttpException(
        { message: 'Invalid old password' },
        HttpStatus.UNAUTHORIZED,
      );
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

  // Reset password
  async resetPassword(
    token: string,
    newPassword: string,
    confirmNewPassword: string,
  ) {
    const user = await this.usersModel.findOne({ resetToken: token });
    if (!user) {
      throw new HttpException(
        { message: 'Invalid token' },
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (newPassword !== confirmNewPassword) {
      throw new HttpException(
        { message: 'Passwords do not match' },
        HttpStatus.BAD_REQUEST,
      );
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    user.resetToken = '';
    await user.save();
    return {
      statusCode: HttpStatus.OK,
      message: 'Password reset successfully',
      data: user,
    };
  }

  // Google OAuth2 login
  async googleLogin(req: any) {
    try {
      if (!req.user) {
        return 'No user from google';
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
        req.user = newUser;
      } else {
        req.user = user;
      }

      const payload = { _id: req.user._id, role: req.user.role };

      return {
        statusCode: HttpStatus.OK,
        message: 'Login successful',
        data: {
          accessToken: req.user.accessToken,
          refreshToken: req.user.refreshToken,
          user: req.user,
        },
      };
    } catch (error) {
      console.error(error.message);
      throw new HttpException(
        { message: 'Something went wrong' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
