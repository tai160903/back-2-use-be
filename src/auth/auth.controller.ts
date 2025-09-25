import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { AuthDto } from './dto/auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Register a new user',
    description: 'Register a new user in the system',
  })
  @Post('register')
  register(@Body() authDto: AuthDto) {
    return this.authService.register(authDto);
  }

  @ApiOperation({
    summary: 'Login a user',
    description: 'Login a user in the system',
  })
  @Post('login')
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
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  // @ApiOperation({
  //   summary: 'Forgot password',
  //   description: 'Send password reset instructions to user email',
  // })
  // @Post('forgot-password')
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       email: { type: 'string', example: 'john.doe@example.com' },
  //     },
  //     required: ['email'],
  //   },
  // })
  // async forgotPassword(@Body() body: { email: string }) {
  //   return this.authService.forgotPassword(body.email);
  // }

  // @Post('change-password')
  // changePassword(@Body() changePasswordDto: ChangePasswordDto) {
  //   return this.authService.changePassword(changePasswordDto);
  // }
}
