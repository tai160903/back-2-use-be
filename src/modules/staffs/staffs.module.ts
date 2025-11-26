import { Module } from '@nestjs/common';
import { StaffsService } from './staffs.service';
import { StaffsController } from './staffs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Staff, StaffSchema } from './schemas/staffs.schema';
import {
  Businesses,
  BusinessesSchema,
} from '../businesses/schemas/businesses.schema';
import { Users, UsersSchema } from '../users/schemas/users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Staff.name, schema: StaffSchema },
      { name: Businesses.name, schema: BusinessesSchema },
      { name: Users.name, schema: UsersSchema },
    ]),
  ],
  controllers: [StaffsController],
  providers: [StaffsService],
})
export class StaffsModule {}
