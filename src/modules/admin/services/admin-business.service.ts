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
import { Users } from 'src/modules/users/schemas/users.schema';
import { UpdateBusinessBlockStatusDto } from '../dto/admin-business/update-business-block-status.dto';
import { MailerDto } from 'src/infrastructure/mailer/dto/mailer.dto';
import { blockNotificationTemplate } from 'src/infrastructure/mailer/templates/block-notification';
import { MailerService } from 'src/infrastructure/mailer/mailer.service';
import { UserBlockHistoryDocument } from 'src/modules/users/schemas/users-block-history';

@Injectable()
export class AdminBusinessService {
  constructor(
    @InjectModel(Businesses.name)
    private readonly businessModel: Model<Businesses>,
    // private readonly userBlockHistoryModel: Model<UserBlockHistoryDocument>,
    private mailerService: MailerService,
  ) {}

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
  // async updateBlockStatus(
  //   id: string,
  //   dto: UpdateBusinessBlockStatusDto,
  //   adminId?: string,
  // ): Promise<APIResponseDto<SimpleBusinessDto>> {
  //   const { isBlocked, reason } = dto;

  //   // 1️⃣ Kiểm tra ObjectId
  //   if (!isValidObjectId(id)) {
  //     throw new BadRequestException(`Invalid Business ID '${id}'`);
  //   }

  //   // 2️⃣ Lấy business và user info
  //   const business = await this.businessModel
  //     .findById(id)
  //     .populate<{ userId: HydratedDocument<Users> }>('userId')
  //     .exec();

  //   if (!business) {
  //     throw new NotFoundException(`Business with ID '${id}' not found`);
  //   }

  //   const user = business.userId as Users;

  //   // 3️⃣ Kiểm tra trạng thái hiện tại
  //   if (user.isBlocked === isBlocked) {
  //     return {
  //       statusCode: HttpStatus.OK,
  //       message: `Business is already ${isBlocked ? 'blocked' : 'unblocked'}`,
  //     };
  //   }

  //   // 4️⃣ Cập nhật trạng thái block
  //   user.isBlocked = isBlocked;
  //   await user.save();

  //   // 5️⃣ Lưu lịch sử block
  //   await this.userBlockHistoryModel.create({
  //     userId: user._id,
  //     reason,
  //     isBlocked,
  //     blockBy: adminId || null,
  //   });

  //   // 6️⃣ Gửi email thông báo
  //   const html = blockNotificationTemplate(user.name, isBlocked, reason);

  //   const mailer: MailerDto = {
  //     to: [{ name: user.name, address: user.email }],
  //     subject: isBlocked
  //       ? 'Your Business Account Has Been Blocked'
  //       : 'Your Business Account Has Been Unblocked',
  //     html,
  //   };

  //   try {
  //     await this.mailerService.sendMail(mailer);
  //   } catch (error) {
  //     console.error('❌ Failed to send block/unblock email:', error.message);
  //   }

  //   // 7️⃣ Flatten dữ liệu giống getAllBusinesses
  //   const result: SimpleBusinessDto = {
  //     _id: business._id.toString(),
  //     userId: user._id.toString(),
  //     storeName: business.storeName,
  //     storePhone: business.storePhone,
  //     storeAddress: business.storeAddress,
  //     role: user.role,
  //     isActive: user.isActive,
  //     isBlocked: user.isBlocked,
  //     createdAt: business.createdAt!,
  //     updatedAt: business.updatedAt!,
  //   };

  //   return {
  //     statusCode: HttpStatus.OK,
  //     message: `Business has been ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
  //     data: result,
  //   };
  // }
}
