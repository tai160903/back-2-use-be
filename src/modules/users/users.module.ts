import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Users, UsersSchema } from './schemas/users.schema';
import { WalletsModule } from '../wallets/wallets.module';
import { Wallets, WalletsSchema } from '../wallets/schemas/wallets.schema';
import {
  UserBlockHistory,
  UserBlockHistorySchema,
} from './schemas/users-block-history';
import { CloudinaryModule } from 'src/infrastructure/cloudinary/cloudinary.module';
import { Customers, CustomersSchema } from './schemas/customer.schema';
import {
  Businesses,
  BusinessesSchema,
} from '../businesses/schemas/businesses.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Users.name, schema: UsersSchema },
      { name: Customers.name, schema: CustomersSchema },
      { name: Wallets.name, schema: WalletsSchema },
      { name: Businesses.name, schema: BusinessesSchema },
      { name: UserBlockHistory.name, schema: UserBlockHistorySchema },
    ]),
    WalletsModule,
    CloudinaryModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
