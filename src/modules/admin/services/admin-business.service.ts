import { isValidObjectId, Model, Types } from 'mongoose';
import {
  Injectable,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Businesses } from 'src/modules/businesses/schemas/businesses.schema';
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
import {
  BusinessDetailProjectionStage,
  BusinessProjectionStage,
  RemoveUserFieldStage,
  UserLookupStage,
} from 'src/common/pipelines';
import path from 'path';

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

  // Admin get all businesses
  async getAllBusinesses(
    query: GetBusinessQueryDto,
  ): Promise<APIPaginatedResponseDto<SimpleBusinessDto[]>> {
    const { isBlocked, page = 1, limit = 10 } = query;

    const pipeline: Record<string, any>[] = [
      UserLookupStage,
      {
        $match: {
          ...(isBlocked !== undefined ? { 'user.isBlocked': isBlocked } : {}),
          'user.role': { $in: [RolesEnum.BUSINESS] },
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      BusinessProjectionStage,
    ];

    const result = await aggregatePaginate(
      this.businessModel,
      pipeline,
      page,
      limit,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Get businesses successfully',
      data: result.data,
      total: result.total,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
    };
  }

  // Get business by id
  async getBusinessById(id: string): Promise<APIResponseDto<Businesses>> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid Business ID '${id}'`);
    }

    const pipeline: any[] = [
      UserLookupStage,
      {
        $match: { _id: new Types.ObjectId(id) },
      },
      BusinessDetailProjectionStage,
      RemoveUserFieldStage,
    ];

    const result = await this.businessModel
      .aggregate<Businesses>(pipeline)
      .exec();

    if (!result || result.length === 0) {
      throw new NotFoundException(`Business with ID '${id}' not found`);
    }

    return {
      statusCode: HttpStatus.OK,
      message: `Get business details successfully`,
      data: result[0],
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

    const business = await this.businessModel.findOne({
      userId: new Types.ObjectId(id),
    });

    const user = await this.userModel.findOne({
      _id: id,
      role: RolesEnum.BUSINESS,
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (!user) {
      throw new NotFoundException('Associated user not found');
    }

    if (user.isBlocked === isBlocked) {
      return {
        statusCode: HttpStatus.OK,
        message: `Business is already ${isBlocked ? 'blocked' : 'unblocked'}`,
      };
    }

    user.isBlocked = isBlocked;
    await user.save();

    await this.userBlockHistoryModel.create({
      userId: business.userId,
      reason,
      isBlocked,
      blockBy: adminId || null,
    });

    const html = blockNotificationTemplate(
      business.businessName,
      isBlocked,
      reason,
    );

    const mailer: MailerDto = {
      to: [{ name: business.businessName, address: user.email }],
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
