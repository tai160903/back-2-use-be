import { Wallets, WalletsDocument } from './../wallets/schemas/wallets.schema';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { Users, UsersDocument } from './schemas/users.schema';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import {
  UserBlockHistory,
  UserBlockHistoryDocument,
} from './schemas/users-block-history';
import { GetUserBlockHistoryQueryDto } from './dto/get-user-block-history-query.dto';
import { paginate } from 'src/common/utils/pagination.util';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Users.name) private usersModel: Model<UsersDocument>,
    @InjectModel(Wallets.name) private walletsModel: Model<WalletsDocument>,
    @InjectModel(UserBlockHistory.name)
    private readonly blockHistoryModel: Model<UserBlockHistoryDocument>,
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
        data: { user, wallet },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateMe(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<APIResponseDto> {
    try {
      if (updateUserDto?.yob) {
        updateUserDto.yob = new Date(updateUserDto.yob);
      }
      const updatedUser = await this.usersModel.findByIdAndUpdate(
        userId,
        updateUserDto,
        { new: true },
      );
      console.log(updatedUser);
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

  // Get user block history
  async getUserBlockHistory(
    userId: string,
    query: GetUserBlockHistoryQueryDto,
  ): Promise<APIPaginatedResponseDto<UserBlockHistory[]>> {
    const { page = 1, limit = 10 } = query;
    const user = await this.usersModel.findById(userId);

    if (!isValidObjectId(userId)) {
      throw new BadRequestException(`Invalid User ID '${userId}'`);
    }

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    const filter = { userId: new Types.ObjectId(userId) };

    const { data, total, currentPage, totalPages } =
      await paginate<UserBlockHistoryDocument>(
        this.blockHistoryModel,
        filter,
        page,
        limit,
      );

    const populatedData = await this.blockHistoryModel.populate(data, [
      { path: 'blockBy', select: 'name email' },
    ]);

    return {
      statusCode: HttpStatus.OK,
      message: 'Block/unblock history retrieved successfully',
      data: populatedData,
      total,
      currentPage,
      totalPages,
    };
  }
}
