import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Request,
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
import { AuthGuard } from './auth.guard';

@Controller('auth')
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

  // sendMailForgotPassword
  @ApiOperation({
    summary: 'Send forgot password email',
    description: 'Send an email to the user with password reset instructions',
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
  @Post('send-forgot-password-email')
  async sendMailForgotPassword(@Body() body: { email: string }) {
    return this.authService.sendMailForgotPassword(body.email);
  }

  //Reset password
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset user password using the provided token',
  })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'Password reset token sent to user email',
    example: 'your-reset-token',
  })
  @Get('reset-password')
  resetPassword(@Query('token') token: string) {
    return { message: 'Reset password page', token };
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
}
