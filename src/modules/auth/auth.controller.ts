import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Redirect,
  UseFilters,
} from '@nestjs/common';
import { AuthService } from './auth.service';

import { ApiBody, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthDto } from './dto/auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { GoogleOAuthGuard } from '../../common/guards/google-oauth.guard';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';

@Controller('auth')
@UseFilters(HttpExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  //Register
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Register a new user in the system',
  })
  @ApiBody({ type: AuthDto, required: true })
  @Post('register')
  register(@Body() authDto: AuthDto) {
    return this.authService.register(authDto);
  }

  //Login
  @ApiOperation({
    summary: 'Login a user',
    description: 'Login a user in the system',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'johndoe' },
        password: { type: 'string', example: 'password123' },
      },
      required: ['username', 'password'],
    },
  })
  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
  }

  //Active account (OTP + email)
  @ApiOperation({
    summary: 'Activate user account',
    description: 'Activate a user account using OTP code and email',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'john.doe@example.com' },
        otp: { type: 'string', example: '123456' },
      },
      required: ['email', 'otp'],
    },
  })
  @Post('active-account')
  activeAccount(@Body() body: { email: string; otp: string }) {
    return this.authService.activeAccount(body.email, body.otp);
  }

  //Resend OTP
  @ApiOperation({
    summary: 'Resend OTP code',
    description: 'Resend OTP code to user email for account verification',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'john.doe@example.com' },
      },
      required: ['email'],
    },
  })
  @Post('resend-otp')
  async resendOtp(@Body() body: { email: string }) {
    return this.authService.resendOtp(body.email);
  }

  //Forgot password
  @ApiOperation({
    summary: 'Forgot password',
    description: 'Send password reset instructions to user email',
  })
  @Post('forgot-password')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'john.doe@example.com' },
      },
      required: ['email'],
    },
  })
  @Post('forgot-password')
  async sendMailForgotPassword(@Body() body: { email: string }) {
    return this.authService.sendMailForgotPassword(body.email);
  }

  //Change password
  @ApiOperation({
    summary: 'Change password',
    description: 'Change the password of the authenticated user',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        oldPassword: { type: 'string', example: 'oldPassword123' },
        newPassword: { type: 'string', example: 'newPassword123' },
        confirmNewPassword: { type: 'string', example: 'newPassword123' },
      },
      required: ['oldPassword', 'newPassword', 'confirmNewPassword'],
    },
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Post('change-password')
  changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req: any,
  ) {
    return this.authService.changePassword(changePasswordDto, req.user);
  }

  //Reset password (OTP)
  @ApiOperation({
    summary: 'Reset password with OTP',
    description: 'Reset user password using OTP code sent to email',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'john.doe@example.com' },
        otp: { type: 'string', example: '123456' },
        newPassword: { type: 'string', example: 'newPassword123' },
        confirmNewPassword: { type: 'string', example: 'newPassword123' },
      },
      required: ['email', 'otp', 'newPassword', 'confirmNewPassword'],
    },
  })
  @Post('reset-password')
  async resetPassword(
    @Body()
    body: {
      email: string;
      otp: string;
      newPassword: string;
      confirmNewPassword: string;
    },
  ) {
    return this.authService.verifyOtpAndResetPassword(
      body.email,
      body.otp,
      body.newPassword,
      body.confirmNewPassword,
    );
  }

  @ApiOperation({
    summary: 'Google OAuth login (web)',
    description: 'Redirects to Google for OAuth login (web client)',
  })
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  googleAuth() {
    return;
  }

  @ApiOperation({
    summary: 'Google OAuth redirect (web)',
    description: 'Google redirects here after login (web client)',
  })
  @Get('google-redirect')
  @UseGuards(GoogleOAuthGuard)
  @Redirect('http://localhost:5173/auth/googleCallback', 302)
  async googleAuthRedirect(@Request() req) {
    try {
      const result = await this.authService.googleLogin(req);
      if (
        typeof result === 'object' &&
        result.data &&
        result.data.accessToken
      ) {
        return {
          url: `http://localhost:5173/auth/googleCallback?token=${result.data.accessToken}`,
        };
      }
    } catch (error) {
      console.error('Error resetting password:', error);
    }
    return {
      url: 'http://localhost:5173/',
    };
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({
    schema: {
      properties: { refreshToken: { type: 'string', example: '...' } },
      required: ['refreshToken'],
    },
  })
  @Post('refresh-token')
  async refreshToken(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }
}
