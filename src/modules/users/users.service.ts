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
import { CloudinaryService } from 'src/infrastructure/cloudinary/cloudinary.service';
import { Customers } from './schemas/customer.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Users.name) private usersModel: Model<UsersDocument>,
    @InjectModel(Customers.name) private customersModel: Model<any>,
    @InjectModel(Wallets.name) private walletsModel: Model<WalletsDocument>,
    @InjectModel(UserBlockHistory.name)
    private readonly blockHistoryModel: Model<UserBlockHistoryDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // Update avatar: upload to Cloudinary and save URL to user
  async updateAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<APIResponseDto> {
    try {
      if (!file || !file.buffer) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }

      const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowed.includes(file.mimetype)) {
        throw new HttpException('Invalid file type', HttpStatus.BAD_REQUEST);
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new HttpException('File too large', HttpStatus.PAYLOAD_TOO_LARGE);
      }

      const result = await this.cloudinaryService.uploadFile(
        file,
        'users/avatars',
      );
      const avatarUrl = String((result as any).secure_url);

      const updated = await this.usersModel
        .findByIdAndUpdate(userId, { avatar: avatarUrl }, { new: true })
        .select('-password');

      if (!updated) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Avatar updated',
        data: updated.avatar,
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to update avatar',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findMe(userId: string): Promise<APIResponseDto> {
    try {
      const user = await this.usersModel
        .findOne({ _id: userId })
        .select('-password')
        .lean();

      const customer = await this.customersModel.findOne({ userId });

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
        data: {
          email: user.email,
          avatar: user.avatar || '',
          fullName: customer?.fullName || '',
          phone: customer?.phone || '',
          address: customer?.address || '',
          yob: customer?.yob || null,
          rewardPoints: customer?.rewardPoints || 0,
          legitPoints: customer?.legitPoints || 0,
          wallet: {
            id: wallet._id,
            balance: wallet.balance,
          },
        },
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
      Object.keys(updateUserDto).forEach((key) => {
        const value = updateUserDto[key];
        if (typeof value === 'string') {
          updateUserDto[key] = value.trim();
          if (updateUserDto[key] === '') delete updateUserDto[key];
        }
      });

      const customer = await this.customersModel.findOne({ userId });
      if (!customer) {
        throw new NotFoundException('Customer profile not found');
      }

      if (updateUserDto.yob) {
        const dob = new Date(updateUserDto.yob);
        if (isNaN(dob.getTime())) {
          throw new BadRequestException('Invalid date of birth format');
        }
        const now = new Date();
        if (dob > now) {
          throw new BadRequestException(
            'Date of birth cannot be in the future',
          );
        }
        if (dob.getFullYear() < 1900) {
          throw new BadRequestException('Date of birth is too old');
        }
      }

      // if (updateUserDto.phone) {
      //   const existing = await this.customersModel.findOne({
      //     phone: updateUserDto.phone,
      //     userId: { $ne: userId },
      //   });
      //   if (existing) {
      //     throw new BadRequestException('Phone number already in use');
      //   }
      // }

      const updatedCustomer = await this.customersModel.findOneAndUpdate(
        { userId },
        { $set: updateUserDto },
        { new: true },
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Profile updated',
        data: updatedCustomer,
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
    const { page = 1, limit = 10, isBlocked } = query;

    if (!isValidObjectId(userId)) {
      throw new BadRequestException(`Invalid User ID '${userId}'`);
    }

    const user = await this.usersModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    const filter: any = { userId: new Types.ObjectId(userId) };

    if (typeof isBlocked === 'boolean') {
      filter.isBlocked = isBlocked;
    }

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
