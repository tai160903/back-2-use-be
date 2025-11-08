import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProductSizeDto } from './dto/create-product-size.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ProductSize } from './schemas/product-size.schema';
import { Model, Types } from 'mongoose';
import { Users } from '../users/schemas/users.schema';
import { Businesses } from '../businesses/schemas/businesses.schema';
import { ProductGroup } from '../product-groups/schemas/product-group.schema';
import { Material } from '../materials/schemas/material.schema';

@Injectable()
export class ProductSizesService {
  constructor(
    @InjectModel(ProductSize.name) private productSizeModel: Model<ProductSize>,
    @InjectModel(Users.name) private userModel: Model<Users>,
    @InjectModel(Businesses.name) private businessModel: Model<Businesses>,
    @InjectModel(ProductGroup.name)
    private productGroupModel: Model<ProductGroup>,
    @InjectModel(Material.name) private materialModel: Model<Material>,
  ) {}
  async createProductSize(
    createProductSizeDto: CreateProductSizeDto,
    userId: string,
  ) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const business = await this.businessModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!business) {
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);
      }

      const productGroup = await this.productGroupModel.findById(
        new Types.ObjectId(createProductSizeDto.productGroupId),
      );
      if (!productGroup) {
        throw new HttpException(
          'Product group not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const existingSize = await this.productSizeModel.findOne({
        sizeName: {
          $regex: `^${createProductSizeDto.sizeName}$`,
          $options: 'i',
        },
        productGroupId: new Types.ObjectId(createProductSizeDto.productGroupId),
        businessId: new Types.ObjectId(business._id),
      });

      if (existingSize) {
        throw new HttpException(
          'Product size already exists',
          HttpStatus.BAD_REQUEST,
        );
      }

      const material = await this.materialModel.findOne({
        _id: new Types.ObjectId(productGroup.materialId),
        isActive: true,
      });

      if (!material) {
        throw new HttpException('Material not found', HttpStatus.NOT_FOUND);
      }

      const trimmedName = createProductSizeDto.sizeName.trim();
      const lowerName = trimmedName.toLowerCase();
      const displayName =
        lowerName.charAt(0).toUpperCase() + lowerName.slice(1);
      createProductSizeDto.sizeName = displayName;

      const depositValue =
        createProductSizeDto.basePrice * material.depositPercent * 0.01;

      const newProductSize = await this.productSizeModel.create({
        ...createProductSizeDto,
        businessId: new Types.ObjectId(business._id),
        productGroupId: new Types.ObjectId(createProductSizeDto.productGroupId),
        depositValue,
      });
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Product size created successfully',
        data: newProductSize,
      };
    } catch (error) {
      // Giữ nguyên các HttpException đã ném trước đó
      if (error instanceof HttpException) {
        throw error;
      }

      // Bị lỗi duplicate key từ Mongo (code 11000) do unique index / race condition
      let isDuplicateKey = false;
      if (typeof error === 'object' && error !== null) {
        const errObj = error as { code?: number; message?: string };
        if (errObj.code === 11000) {
          isDuplicateKey = true;
        } else if (
          typeof errObj.message === 'string' &&
          errObj.message.includes('duplicate key')
        ) {
          isDuplicateKey = true;
        }
      }

      if (isDuplicateKey) {
        // Map lỗi duplicate trong DB thành 400 cho thống nhất với logic kiểm tra thủ công
        throw new HttpException(
          'Product size already exists',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Các lỗi khác: 500
      throw new HttpException(
        (error as Error).message || 'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
