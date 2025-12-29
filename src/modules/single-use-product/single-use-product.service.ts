import { Model, Types } from 'mongoose';
import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  SingleUseProductType,
  SingleUseProductTypeDocument,
} from '../single-use-product-type/schemas/single-use-product-type.schema';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import {
  SingleUseProductSize,
  SingleUseProductSizeDocument,
} from '../single-use-product-size/schemas/single-use-product-size.schema';
import {
  SingleUseProduct,
  SingleUseProductDocument,
} from './schemas/single-use-product.schema';
import { CreateSingleUseProductDto } from '../businesses/dto/create-single-use-product.dto';
import { Material } from '../materials/schemas/material.schema';
import {
  BusinessDocument,
  Businesses,
} from '../businesses/schemas/businesses.schema';
import { CloudinaryService } from 'src/infrastructure/cloudinary/cloudinary.service';
import { GetSingleUseProductByBusinessQueryDto } from './dto/get-single-use-product-by-business-query.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { paginate } from 'src/common/utils/pagination.util';

@Injectable()
export class SingleUseProductService {
  constructor(
    @InjectModel(SingleUseProductType.name)
    private readonly typeModel: Model<SingleUseProductTypeDocument>,

    @InjectModel(SingleUseProductSize.name)
    private readonly sizeModel: Model<SingleUseProductSizeDocument>,

    @InjectModel(SingleUseProduct.name)
    private readonly productModel: Model<SingleUseProductDocument>,

    @InjectModel(Material.name)
    private readonly materialModel: Model<Material>,

    @InjectModel(Businesses.name)
    private readonly businessModel: Model<BusinessDocument>,
  ) {}

  async getByBusiness(
    businessId: string,
    query: GetSingleUseProductByBusinessQueryDto,
  ): Promise<APIPaginatedResponseDto<SingleUseProduct[]>> {
    const { page = 1, limit = 10 } = query;

    if (!Types.ObjectId.isValid(businessId)) {
      throw new BadRequestException('Invalid businessId');
    }

    const filter = {
      businessId: new Types.ObjectId(businessId),
      isActive: true, // ✅ auto filter
    };

    const { data, total, currentPage, totalPages } =
      await paginate<SingleUseProductDocument>(
        this.productModel,
        filter,
        page,
        limit,
        undefined,
        { createdAt: -1 },
        [
          { path: 'productTypeId', select: 'name' },
          { path: 'productSizeId', select: 'sizeName minWeight maxWeight' },
          { path: 'materialId', select: 'materialName description' },
        ],
      );

    return {
      statusCode: 200,
      message: 'Get single-use products by business successfully',
      data,
      total,
      currentPage,
      totalPages,
    };
  }
}
