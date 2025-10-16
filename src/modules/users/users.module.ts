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
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Users.name, schema: UsersSchema },
      { name: Wallets.name, schema: WalletsSchema },
      { name: UserBlockHistory.name, schema: UserBlockHistorySchema },
    ]),
    WalletsModule,
    CloudinaryModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
