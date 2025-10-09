import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { GoogleStrategy } from './strategies/google.strategy';

import { JwtStrategy } from './strategies/jwt.strategy';
import { Users, UsersSchema } from '../users/schemas/users.schema';

import { WalletsModule } from '../wallets/wallets.module';
import { MailerModule } from 'src/infrastructure/mailer/mailer.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Users.name, schema: UsersSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        global: true,
        secret: config.get<string>('jwt.accessToken.secret'),
        signOptions: config.get('jwt.accessToken.signOptions'),
      }),
    }),
    MailerModule,
    WalletsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtStrategy],
})
export class AuthModule {}
