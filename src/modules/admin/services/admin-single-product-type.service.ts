import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SingleUseProductType,
  SingleUseProductTypeDocument,
} from 'src/modules/single-use-product-type/schemas/single-use-product-type.schema';
import { CreateSingleUseProductTypeDto } from '../dto/admin-single-product-type/create-single-use-product-type.dto';
import { GetSingleUseProductTypeQueryDto } from '../dto/admin-single-product-type/get-single-use-product-type.dto';
import { paginate } from 'src/common/utils/pagination.util';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';

@Injectable()
export class AdminSingleUseProductTypeService {
  constructor(
    @InjectModel(SingleUseProductType.name)
    private readonly typeModel: Model<SingleUseProductTypeDocument>,
  ) {}

  // CREATE
  async create(
    dto: CreateSingleUseProductTypeDto,
  ): Promise<APIResponseDto<SingleUseProductType>> {
    const normalizedName = dto.name.trim();

    const existed = await this.typeModel.findOne({
      name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
    });

    if (existed) {
      throw new ConflictException(
        `Single use product type '${normalizedName}' already exists`,
      );
    }

    const type = await this.typeModel.create({
      name: normalizedName,
      isActive: true,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: `Create single use product type '${type.name}' successfully`,
      data: type,
    };
  }

  // GET LIST
  async get(
    query: GetSingleUseProductTypeQueryDto,
  ): Promise<APIPaginatedResponseDto<SingleUseProductType[]>> {
    const { page = 1, limit = 10, isActive } = query;

    const filter: Record<string, any> = {};
    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
    }

    const { data, total, currentPage, totalPages } =
      await paginate<SingleUseProductTypeDocument>(
        this.typeModel,
        filter,
        page,
        limit,
      );

    return {
      statusCode: HttpStatus.OK,
      message: 'Get single use product types successfully',
      data,
      total,
      currentPage,
      totalPages,
    };
  }

  async updateStatus(
    id: string,
    isActive: boolean,
  ): Promise<APIResponseDto<SingleUseProductType>> {
    const productType = await this.typeModel.findByIdAndUpdate(
      id,
      { isActive },
      { new: true },
    );

    if (!productType) {
      throw new NotFoundException('Single-use product type not found');
    }

    return {
      statusCode: 200,
      message: `Update single-use product type status successfully`,
      data: productType,
    };
  }
}
