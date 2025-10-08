import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallets, WalletsSchema } from './schemas/wallets.schema';
import { VnpayModule } from '../vnpay/vnpay.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wallets.name, schema: WalletsSchema }]),
    VnpayModule,
  ],
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}
