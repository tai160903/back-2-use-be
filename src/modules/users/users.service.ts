import { Wallets, WalletsDocument } from './../wallets/schemas/wallets.schema';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
// import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users, UsersDocument } from './schemas/users.schema';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Users.name) private usersModel: Model<UsersDocument>,
    @InjectModel(Wallets.name) private walletsModel: Model<WalletsDocument>,
  ) {}

  async findMe(userId: string): Promise<APIResponseDto> {
    try {
      const user = await this.usersModel
        .findOne({ _id: userId })
        .select('-password')
        .lean();
      const wallet = await this.walletsModel.findOne({ userId });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (!wallet) {
        throw new HttpException('Wallet not found', HttpStatus.NOT_FOUND);
      }
      return {
        statusCode: HttpStatus.OK,
        message: 'User found successfully',
        data: { ...user.toObject(), wallet },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateMe(userId: string, updateUserDto: any): Promise<APIResponseDto> {
    try {
      const updatedUser = await this.usersModel.findByIdAndUpdate(
        userId,
        updateUserDto,
        { new: true },
      );
      if (!updatedUser) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return {
        statusCode: HttpStatus.OK,
        message: 'User updated successfully',
        data: updatedUser,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
