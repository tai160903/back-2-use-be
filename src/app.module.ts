import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VnpayModule } from './infrastructure/vnpay/vnpay.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import jwtConfig from './config/jwt.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MaterialModule } from './modules/materials/material.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { CloudinaryModule } from './infrastructure/cloudinary/cloudinary.module';
import { AdminModule } from './modules/admin/admin.module';

import vnpayConfig from './config/vnpay.config';
import { MailerModule } from './infrastructure/mailer/mailer.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { WalletTransactions } from './modules/wallet-transactions/schema/wallet-transactions.schema';
import { WalletTransactionsModule } from './modules/wallet-transactions/wallet-transactions.module';
import { ScheduleModule } from '@nestjs/schedule';
import { VouchersModule } from './modules/vouchers/vouchers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig, vnpayConfig],
    }),
    MongooseModule.forRoot(process.env.DATABASE_URL || ''),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    MailerModule,
    MaterialModule,
    BusinessesModule,
    WalletsModule,
    WalletTransactionsModule,
    CloudinaryModule,
    AdminModule,
    VnpayModule,
    SubscriptionsModule,
    VouchersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
