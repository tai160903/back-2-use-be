import { isValidObjectId, Model } from 'mongoose';
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

@Injectable()
export class AdminBusinessService {
  constructor(
    @InjectModel(Businesses.name)
    private readonly businessModel: Model<Businesses>,
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

  // Admin update block status
}
