import { Model, Types } from 'mongoose';
import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  SingleUseProductSize,
  SingleUseProductSizeDocument,
} from 'src/modules/single-use-product-size/schemas/single-use-product-size.schema';
import {
  SingleUseProductType,
  SingleUseProductTypeDocument,
} from 'src/modules/single-use-product-type/schemas/single-use-product-type.schema';
import { AdminCreateSingleUseProductSizeDto } from '../dto/admin-single-product-size/create-single-use-product-size.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { GetSingleUseProductSizeQueryDto } from '../dto/admin-single-product-size/get-single-use-product-size-query.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { Type } from 'class-transformer';

@Injectable()
export class AdminSingleUseProductSizeService {
  constructor(
    @InjectModel(SingleUseProductSize.name)
    private readonly sizeModel: Model<SingleUseProductSizeDocument>,

    @InjectModel(SingleUseProductType.name)
    private readonly typeModel: Model<SingleUseProductTypeDocument>,
  ) {}

  // Admin create size
  async create(
    dto: AdminCreateSingleUseProductSizeDto,
  ): Promise<APIResponseDto<SingleUseProductSize>> {
    const { productTypeId, sizeName, minWeight, maxWeight } = dto;

    if (minWeight >= maxWeight) {
      throw new BadRequestException('minWeight must be less than maxWeight');
    }

    const productType = await this.typeModel.findById(productTypeId);
    if (!productType || !productType.isActive) {
      throw new NotFoundException('Product type not found or inactive');
    }

    const existed = await this.sizeModel.findOne({
      productTypeId,
      sizeName: sizeName.trim(),
    });

    if (existed) {
      throw new ConflictException(
        `Size '${sizeName}' already exists for this product type`,
      );
    }

    const size = await this.sizeModel.create({
      productTypeId: new Types.ObjectId(productTypeId),
      sizeName: sizeName.trim(),
      minWeight,
      maxWeight,
      isActive: true,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: `Create single-use product size '${size.sizeName}' successfully`,
      data: size,
    };
  }

  // Admin get sizes
  async get(
    query: GetSingleUseProductSizeQueryDto,
  ): Promise<APIResponseDto<SingleUseProductSize[]>> {
    const filter: Record<string, any> = {};

    if (query.productTypeId) {
      filter.productTypeId = new Types.ObjectId(query.productTypeId);
    }

    if (typeof query.isActive === 'boolean') {
      filter.isActive = query.isActive;
    }

    const sizes = await this.sizeModel
      .find(filter)
      .populate('productTypeId', 'name')
      .sort({ createdAt: -1 })
      .exec();

    return {
      statusCode: HttpStatus.OK,
      message: 'Get single-use product sizes successfully',
      data: sizes,
    };
  }

  // Update isActive status
  async updateStatus(
    id: string,
    isActive: boolean,
  ): Promise<APIResponseDto<SingleUseProductSize>> {
    const size = await this.sizeModel.findByIdAndUpdate(
      id,
      { isActive },
      { new: true },
    );

    if (!size) {
      throw new NotFoundException('Single-use product size not found');
    }

    return {
      statusCode: 200,
      message: 'Update single-use product size status successfully',
      data: size,
    };
  }
}
