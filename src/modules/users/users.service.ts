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
import { RolesEnum } from 'src/common/constants/roles.enum';
import {
  UserBlockHistory,
  UserBlockHistoryDocument,
} from './schemas/users-block-history';
import { GetUserBlockHistoryQueryDto } from './dto/get-user-block-history-query.dto';
import { paginate } from 'src/common/utils/pagination.util';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { CloudinaryService } from 'src/infrastructure/cloudinary/cloudinary.service';
import { Customers, CustomersDocument } from './schemas/customer.schema';
import {
  Businesses,
  BusinessDocument,
} from '../businesses/schemas/businesses.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Users.name) private usersModel: Model<UsersDocument>,
    @InjectModel(Customers.name)
    private customersModel: Model<CustomersDocument>,
    @InjectModel(Wallets.name) private walletsModel: Model<WalletsDocument>,
    @InjectModel(Businesses.name)
    private businessesModel: Model<BusinessDocument>,
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
      const uploadResult = result as { secure_url?: string } | undefined;
      const avatarUrl = String(uploadResult?.secure_url ?? '');

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
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : String(error || 'Failed to update avatar');
      const status = (error as any)?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(message, status);
    }
  }

  async findMe(userId: string): Promise<APIResponseDto> {
    try {
      const user = await this.usersModel.findById(userId).select('-password');

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      let customer: CustomersDocument | null = null;
      let business: BusinessDocument | null = null;
      if (user.role === RolesEnum.CUSTOMER) {
        customer = await this.customersModel.findOne({
          userId: new Types.ObjectId(userId),
        });
        if (!customer) {
          throw new HttpException(
            'Customer profile not found',
            HttpStatus.NOT_FOUND,
          );
        }
      } else {
        business = await this.businessesModel.findOne({
          userId: new Types.ObjectId(userId),
        });
        if (!business) {
          throw new HttpException(
            'Business profile not found',
            HttpStatus.NOT_FOUND,
          );
        }
      }
      const wallet = await this.walletsModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!wallet) {
        throw new HttpException('Wallet not found', HttpStatus.NOT_FOUND);
      }
      const data: {
        email: string;
        avatar: string;
        wallet: { _id: Types.ObjectId; balance: number };
        fullName?: string;
        phone?: string;
        address?: string;
        yob?: Date | null;
        rewardPoints?: number;
        legitPoints?: number;
        businessName?: string;
        businessAddress?: string;
        businessPhone?: string;
        taxCode?: string;
        businessType?: string;
        businessLogo?: string;
      } = {
        email: user.email,
        avatar: user.avatar || '',
        wallet: {
          _id: wallet._id,
          balance: wallet.balance,
        },
      };

      if (user.role === RolesEnum.CUSTOMER) {
        data.fullName = customer?.fullName || '';
        data.phone = customer?.phone || '';
        data.address = customer?.address || '';
        data.yob = customer?.yob || null;
        data.rewardPoints = customer?.rewardPoints || 0;
        data.legitPoints = customer?.legitPoints || 0;
      } else {
        data.businessName = business?.businessName || '';
        data.businessAddress = business?.businessAddress || '';
        data.businessPhone = business?.businessPhone || '';
        data.taxCode = business?.taxCode || '';
        data.businessType = business?.businessType || '';
        data.businessLogo = business?.businessLogoUrl || '';
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'User found successfully',
        data,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : String(error || 'Internal server error');
      const status = (error as any)?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(message, status);
    }
  }

  async updateMe(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<APIResponseDto> {
    try {
      const dtoAny = updateUserDto as any;
      Object.keys(dtoAny).forEach((key) => {
        const value = dtoAny[key];
        if (typeof value === 'string') {
          dtoAny[key] = value.trim();
          if (dtoAny[key] === '') delete dtoAny[key];
        }
      });

      const customer = await this.customersModel.findOne({
        userId: new Types.ObjectId(userId),
      });
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
        { userId: new Types.ObjectId(userId) },
        { $set: updateUserDto },
        { new: true },
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Profile updated',
        data: updatedCustomer,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : String(error || 'Internal server error');
      const status = (error as any)?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(message, status);
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

    const filter: Record<string, any> = { userId: new Types.ObjectId(userId) };

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
