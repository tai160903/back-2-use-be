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
} from 'src/modules/single-use-product-type/schemas/single-use-product-type.schema';
import {
  SingleUseProductSize,
  SingleUseProductSizeDocument,
} from 'src/modules/single-use-product-size/schemas/single-use-product-size.schema';
import {
  SingleUseProduct,
  SingleUseProductDocument,
} from 'src/modules/single-use-product/schemas/single-use-product.schema';
import { Material } from 'src/modules/materials/schemas/material.schema';
import { BusinessDocument, Businesses } from '../schemas/businesses.schema';
import { CloudinaryService } from 'src/infrastructure/cloudinary/cloudinary.service';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { CreateSingleUseProductDto } from '../dto/create-single-use-product.dto';
import { UpdateSingleUseProductDto } from '../dto/update-single-use-product.dto';
import { GetMySingleUseProductQueryDto } from '../dto/get-my-single-use-product';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { paginate } from 'src/common/utils/pagination.util';

@Injectable()
export class BusinessSingleUseProductService {
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

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  //   Get active type
  async getActiveTypes(): Promise<APIResponseDto<SingleUseProductType[]>> {
    const types = await this.typeModel
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .exec();

    return {
      statusCode: 200,
      message: 'Get active single-use product types successfully',
      data: types,
    };
  }

  //   Get active size
  async getActiveSizes(
    productTypeId?: string,
  ): Promise<APIResponseDto<SingleUseProductSize[]>> {
    const filter: Record<string, any> = {
      isActive: true,
    };

    if (productTypeId) {
      if (!Types.ObjectId.isValid(productTypeId)) {
        throw new BadRequestException('Invalid productTypeId');
      }

      filter.productTypeId = new Types.ObjectId(productTypeId);
    }

    const sizes = await this.sizeModel
      .find(filter)
      .populate('productTypeId', 'name')
      .sort({ minWeight: 1 })
      .exec();

    return {
      statusCode: 200,
      message: 'Get active single-use product sizes successfully',
      data: sizes,
    };
  }

  //   Create single use Product
  async create(
    userId: string,
    dto: CreateSingleUseProductDto,
    file?: Express.Multer.File,
  ): Promise<APIResponseDto<SingleUseProduct>> {
    const {
      name,
      description,
      productTypeId,
      productSizeId,
      materialId,
      weight,
    } = dto;

    // 0️⃣ Find business
    const business = await this.businessModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!business) {
      throw new NotFoundException('Business not found for this user');
    }

    const businessId = business._id;

    // 1️⃣ Product Type
    const productType = await this.typeModel.findById(productTypeId);
    if (!productType) throw new NotFoundException('Product type not found');
    if (!productType.isActive)
      throw new BadRequestException('Product type must be active');

    // 2️⃣ Product Size
    const productSize = await this.sizeModel.findById(productSizeId);
    if (!productSize) throw new NotFoundException('Product size not found');
    if (!productSize.isActive)
      throw new BadRequestException('Product size must be active');

    if (!productSize.productTypeId.equals(productTypeId)) {
      throw new BadRequestException(
        'Product size does not belong to the selected product type',
      );
    }

    // 3️⃣ Weight
    if (weight < productSize.minWeight || weight > productSize.maxWeight) {
      throw new BadRequestException(
        `Weight must be between ${productSize.minWeight}g and ${productSize.maxWeight}g`,
      );
    }

    // 4️⃣ Material
    const material = await this.materialModel.findById(materialId);
    if (!material) throw new NotFoundException('Material not found');
    if (!material.isActive)
      throw new BadRequestException('Material must be active');
    if (!material.isSingleUse)
      throw new BadRequestException(
        'Material must be single use for single-use products',
      );

    // 5️⃣ Upload image
    let imageUrl: string | undefined;
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadFile(
        file,
        'products/single-use',
      );
      imageUrl = String(uploadResult.secure_url);
    }

    // 6️⃣ CO2
    const co2EmissionPerKg = material.co2EmissionPerKg;
    const co2EmissionRaw = (weight / 1000) * co2EmissionPerKg;

    const co2Emission = Number(co2EmissionRaw.toFixed(3));

    try {
      const product = await this.productModel.create({
        businessId,
        productTypeId: new Types.ObjectId(productTypeId),
        productSizeId: new Types.ObjectId(productSizeId),
        materialId: new Types.ObjectId(materialId),
        name: name.trim(),
        description: description?.trim(),
        imageUrl,
        weight,
        co2EmissionPerKg,
        co2Emission,
        isActive: true,
      });

      return {
        statusCode: 201,
        message: 'Create single-use product successfully',
        data: product,
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          'A single-use product with the same configuration already exists for this business',
        );
      }
      throw error;
    }
  }

  //   Update single use Product
  async update(
    userId: string,
    productId: string,
    dto: UpdateSingleUseProductDto,
    file?: Express.Multer.File,
  ): Promise<APIResponseDto<SingleUseProduct>> {
    // 0️⃣ Business
    const business = await this.businessModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    console.log('productId', productId);
    console.log('businessId', business._id);

    console.log(typeof productId);
    console.log(typeof business._id);

    // 1️⃣ Product
    const product = await this.productModel.findOne({
      _id: new Types.ObjectId(productId),
      businessId: new Types.ObjectId(business._id),
    });
    if (!product) {
      throw new NotFoundException('Single-use product not found');
    }

    const weight = dto.weight ?? product.weight;

    // 4️⃣ Product Size
    const productSize = await this.sizeModel.findById(product.productSizeId);
    if (!productSize) throw new NotFoundException('Product size not found');
    if (!productSize.isActive)
      throw new BadRequestException('Product size must be active');

    // 5️⃣ Weight
    if (weight < productSize.minWeight || weight > productSize.maxWeight) {
      throw new BadRequestException(
        `Weight must be between ${productSize.minWeight}g and ${productSize.maxWeight}g`,
      );
    }

    // 7️⃣ Upload image
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadFile(
        file,
        'products/single-use',
      );
      product.imageUrl = String(uploadResult.secure_url);
    }

    // 8️⃣ CO2
    const co2EmissionPerKg = product.co2EmissionPerKg;
    const co2EmissionRaw = (weight / 1000) * co2EmissionPerKg;
    const co2Emission = Number(co2EmissionRaw.toFixed(3));

    // 9️⃣ Apply updates
    product.weight = weight;
    product.co2EmissionPerKg = co2EmissionPerKg;
    product.co2Emission = co2Emission;

    if (dto.name !== undefined) product.name = dto.name.trim();
    if (dto.description !== undefined)
      product.description = dto.description?.trim();
    if (dto.isActive !== undefined) product.isActive = dto.isActive;

    try {
      await product.save();
      return {
        statusCode: 200,
        message: 'Update single-use product successfully',
        data: product,
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          'A single-use product with the same configuration already exists',
        );
      }
      throw error;
    }
  }

  //   Get my product
  async getMyProducts(
    userId: string,
    query: GetMySingleUseProductQueryDto,
  ): Promise<APIPaginatedResponseDto<SingleUseProduct[]>> {
    const { isActive, page = 1, limit = 10 } = query;

    // 1️⃣ Find business
    const business = await this.businessModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // 2️⃣ Build filter
    const filter: Record<string, any> = {
      businessId: business._id,
    };

    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
    }

    // 3️⃣ Paginate
    const { data, total, currentPage, totalPages } =
      await paginate<SingleUseProductDocument>(
        this.productModel,
        filter,
        page,
        limit,
        undefined, // select
        { createdAt: -1 }, // sort
        [
          { path: 'productTypeId', select: 'name' },
          {
            path: 'productSizeId',
            select: 'sizeName minWeight maxWeight',
          },
          { path: 'materialId', select: 'materialName description' },
        ], // populate
      );

    return {
      statusCode: 200,
      message: 'Get single-use products successfully',
      data,
      total,
      currentPage,
      totalPages,
    };
  }
}
