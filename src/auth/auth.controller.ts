import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Request,
  Redirect,
  UseFilters,
} from '@nestjs/common';
import { AuthService } from './auth.service';

import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthDto } from './dto/auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard } from './guards/auth.guard';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { HttpExceptionFilter } from 'src/common/http-exception.filter';

@Controller('auth')
@UseFilters(HttpExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  //Register
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Register a new user in the system',
  })
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
        email: { type: 'string', example: 'john.doe@example.com' },
        password: { type: 'string', example: 'password123' },
      },
      required: ['email', 'password'],
    },
  })
  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  //Active account
  @ApiOperation({
    summary: 'Activate user account',
    description: 'Activate a user account using the provided token',
  })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'Verification token sent to user email',
    example: 'your-verification-token',
  })
  @Get('active-account')
  activeAccount(@Query('token') token: string) {
    return this.authService.activeAccount(token);
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
  changePassword(@Body() changePasswordDto: ChangePasswordDto, @Request() req) {
    return this.authService.changePassword(changePasswordDto, req.user);
  }

  //Reset password
  @ApiOperation({
    summary: 'Reset password after forgot password',
    description: 'Reset user password using the provided token',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: 'your-reset-token' },
        newPassword: { type: 'string', example: 'newPassword123' },
        confirmNewPassword: { type: 'string', example: 'newPassword123' },
      },
      required: ['token', 'newPassword', 'confirmNewPassword'],
    },
  })
  @Post('reset-password')
  async resetPassword(
    @Body()
    body: {
      token: string;
      newPassword: string;
      confirmNewPassword: string;
    },
  ) {
    return this.authService.resetPassword(
      body.token,
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
}
