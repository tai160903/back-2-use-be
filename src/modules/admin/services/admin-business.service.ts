import { HydratedDocument, isValidObjectId, Model } from 'mongoose';
import {
  Injectable,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  BusinessDocument,
  Businesses,
} from 'src/modules/businesses/schemas/businesses.schema';
import { GetBusinessQueryDto } from '../dto/admin-business/get-businesses-query.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { aggregatePaginate } from 'src/common/utils/aggregate-pagination.util';
import { SimpleBusinessDto } from '../dto/admin-business/simple-businesses.dto';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { Users, UsersDocument } from 'src/modules/users/schemas/users.schema';
import { UpdateBusinessBlockStatusDto } from '../dto/admin-business/update-business-block-status.dto';
import { MailerDto } from 'src/infrastructure/mailer/dto/mailer.dto';
import { blockNotificationTemplate } from 'src/infrastructure/mailer/templates/block-notification';
import { MailerService } from 'src/infrastructure/mailer/mailer.service';
import {
  UserBlockHistory,
  UserBlockHistoryDocument,
} from 'src/modules/users/schemas/users-block-history';
import { UserResponseDto } from '../dto/admin-customer/user-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class AdminBusinessService {
  constructor(
    @InjectModel(Businesses.name)
    private readonly businessModel: Model<Businesses>,
    @InjectModel(UserBlockHistory.name)
    private readonly userBlockHistoryModel: Model<UserBlockHistoryDocument>,
    @InjectModel(Users.name) private readonly userModel: Model<UsersDocument>,
    private mailerService: MailerService,
  ) {}

  projection =
    '_id name email phone address yob role isActive isBlocked createdAt updatedAt';

  // Admin get all businesses (flatten user info)
  async getAllBusinesses(
    query: GetBusinessQueryDto,
  ): Promise<APIPaginatedResponseDto<SimpleBusinessDto[]>> {
    const { isBlocked, page = 1, limit = 10 } = query;

    const pipeline: Record<string, any>[] = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $match: {
          ...(isBlocked !== undefined ? { 'user.isBlocked': isBlocked } : {}),
          'user.role': RolesEnum.BUSINESS,
        },
      },
    ];

    const result = await aggregatePaginate(
      this.businessModel,
      pipeline,
      page,
      limit,
    );

    const flattenedData: SimpleBusinessDto[] = result.data.map((item) => ({
      _id: item._id?.toString(),
      userId: item.userId.toString(),
      storeName: item.storeName,
      storePhone: item.storePhone,
      storeAddress: item.storeAddress,
      role: item.user?.role,
      isActive: item.user?.isActive,
      isBlocked: item.user?.isBlocked,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return {
      statusCode: HttpStatus.OK,
      message: 'Get businesses successfully',
      data: flattenedData,
      total: result.total,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
    };
  }

  async getBusinessById(id: string): Promise<APIResponseDto<Businesses>> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid Business ID '${id}'`);
    }
    const business = await this.businessModel.findById(id).exec();

    if (!business) {
      throw new NotFoundException(`Business with ID '${id}' not found`);
    }

    return {
      statusCode: HttpStatus.OK,
      message: `Business with id '${id}' retrieved successfully`,
      data: business,
    };
  }

  // Admin update business block status
  async updateBlockStatus(
    id: string,
    dto: UpdateBusinessBlockStatusDto,
    adminId?: string,
  ): Promise<APIResponseDto<UserResponseDto>> {
    const { isBlocked, reason } = dto;

    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid Business ID '${id}'`);
    }

    const business = await this.userModel
      .findOne({ _id: id, role: RolesEnum.BUSINESS })
      .select(this.projection);

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.isBlocked === isBlocked) {
      return {
        statusCode: HttpStatus.OK,
        message: `Business is already ${isBlocked ? 'blocked' : 'unblocked'}`,
      };
    }

    business.isBlocked = isBlocked;
    await business.save();

    await this.userBlockHistoryModel.create({
      userId: business._id,
      reason,
      isBlocked,
      blockBy: adminId || null,
    });

    const html = blockNotificationTemplate(business.name, isBlocked, reason);

    const mailer: MailerDto = {
      to: [{ name: business.name, address: business.email }],
      subject: isBlocked
        ? 'Your Account Has Been Blocked'
        : 'Your Account Has Been Unblocked',
      html,
    };

    try {
      await this.mailerService.sendMail(mailer);
    } catch (error) {
      console.error('❌ Failed to send block/unblock email:', error.message);
    }

    const businessDto = plainToInstance(UserResponseDto, business.toObject());

    return {
      statusCode: HttpStatus.OK,
      message: `Business has been ${
        isBlocked ? 'blocked' : 'unblocked'
      } successfully and notification email has been sent.`,
      data: businessDto,
    };
  }
}
