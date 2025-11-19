import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProductSizeDto } from './dto/create-product-size.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ProductSize } from './schemas/product-size.schema';
import { Model, Types } from 'mongoose';
import { Users } from '../users/schemas/users.schema';
import { Businesses } from '../businesses/schemas/businesses.schema';
import { ProductGroup } from '../product-groups/schemas/product-group.schema';
import { Material } from '../materials/schemas/material.schema';
import { UpdateProductSizeDto } from './dto/update-product-size.dto';

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

      if (!createProductSizeDto.weight || createProductSizeDto.weight <= 0) {
        throw new HttpException('Weight is required', HttpStatus.BAD_REQUEST);
      }

      const plasticEquivalentWeight =
        createProductSizeDto.weight * material.plasticEquivalentMultiplier;

      const newProductSize = await this.productSizeModel.create({
        ...createProductSizeDto,
        businessId: new Types.ObjectId(business._id),
        productGroupId: new Types.ObjectId(createProductSizeDto.productGroupId),
        depositValue,
        plasticEquivalentWeight,
      });
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Product size created successfully',
        data: newProductSize,
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getProductSizes(
    userId: string,
    productGroupId: string,
    page: number = 1,
    limit: number = 10,
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

      if (!Types.ObjectId.isValid(productGroupId)) {
        throw new HttpException(
          'Invalid productGroupId',
          HttpStatus.BAD_REQUEST,
        );
      }

      const productGroup = await this.productGroupModel.findById(
        new Types.ObjectId(productGroupId),
      );
      if (!productGroup) {
        throw new HttpException(
          'Product group not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const query: Record<string, unknown> = {
        businessId: business._id,
        productGroupId: productGroup._id,
      };

      const skip = (page - 1) * limit;
      const [sizes, total] = await Promise.all([
        this.productSizeModel
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        this.productSizeModel.countDocuments(query),
      ]);

      return {
        statusCode: HttpStatus.OK,
        message: 'Product sizes fetched successfully',
        data: sizes,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getProductSizeDetail(userId: string, sizeId: string) {
    try {
      if (!Types.ObjectId.isValid(sizeId)) {
        throw new HttpException('Invalid sizeId', HttpStatus.BAD_REQUEST);
      }

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

      const size = await this.productSizeModel.findById(sizeId);
      if (!size) {
        throw new HttpException('Product size not found', HttpStatus.NOT_FOUND);
      }

      if (size.businessId.toString() !== business._id.toString()) {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Product size detail fetched successfully',
        data: size,
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateProductSize(
    userId: string,
    sizeId: string,
    updateDto: UpdateProductSizeDto,
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

      const size = await this.productSizeModel.findById(sizeId);
      if (!size) {
        throw new HttpException('Product size not found', HttpStatus.NOT_FOUND);
      }

      if (updateDto.sizeName && updateDto.sizeName.trim()) {
        const trimmed = updateDto.sizeName.trim();
        const lower = trimmed.toLowerCase();
        const display = lower.charAt(0).toUpperCase() + lower.slice(1);
        updateDto.sizeName = display;

        const existing = await this.productSizeModel.findOne({
          _id: { $ne: new Types.ObjectId(sizeId) },
          businessId: business._id,
          productGroupId: size.productGroupId,
          sizeName: { $regex: `^${display}$`, $options: 'i' },
        });
        if (existing) {
          throw new HttpException(
            'Product size already exists',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const productGroup = await this.productGroupModel.findById(
        size.productGroupId,
      );
      if (!productGroup) {
        throw new HttpException(
          'Product group not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const material = await this.materialModel.findOne({
        _id: new Types.ObjectId(productGroup.materialId),
        isActive: true,
      });

      if (!material) {
        throw new HttpException('Material not found', HttpStatus.NOT_FOUND);
      }

      let newDeposit: number | undefined = undefined;
      if (typeof updateDto.basePrice === 'number') {
        newDeposit = updateDto.basePrice * material.depositPercent * 0.01;
      }

      let newPlasticEquivalent: number | undefined = undefined;

      if (typeof updateDto.weight === 'number') {
        if (updateDto.weight <= 0) {
          throw new HttpException(
            'Weight must be greater than 0',
            HttpStatus.BAD_REQUEST,
          );
        }
        newPlasticEquivalent =
          updateDto.weight * material.plasticEquivalentMultiplier;
      }

      const updated = await this.productSizeModel.findByIdAndUpdate(
        sizeId,
        {
          $set: {
            ...updateDto,
            ...(newDeposit !== undefined ? { depositValue: newDeposit } : {}),
            ...(newPlasticEquivalent !== undefined
              ? { plasticEquivalentWeight: newPlasticEquivalent }
              : {}),
          },
        },
        { new: true },
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Product size updated successfully',
        data: updated,
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
