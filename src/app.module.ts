import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from './mailer/mailer.module';
import jwtConfig from './auth/config/jwt.config';
import { MaterialModule } from './materials/material.module';
import { BusinessesModule } from './businesses/businesses.module';
import { WalletsModule } from './wallets/wallets.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [jwtConfig] }),
    MongooseModule.forRoot(process.env.DATABASE_URL || ''),
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
