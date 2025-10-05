import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import jwtConfig from './config/jwt.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MailerModule } from './modules/mailer/mailer.module';
import { MaterialModule } from './modules/materials/material.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { CloudinaryModule } from './infrastructure/cloudinary/cloudinary.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [jwtConfig] }),
    MongooseModule.forRoot(
      process.env.DATABASE_URL_LOCAL || process.env.DATABASE_URL || '',
    ),
    AuthModule,
    UsersModule,
    MailerModule,
    MaterialModule,
    BusinessesModule,
    WalletsModule,
    CloudinaryModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
