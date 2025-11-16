import { ProductGroup } from './../product-groups/schemas/product-group.schema';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Users } from '../users/schemas/users.schema';
import { Model, Types } from 'mongoose';
import { Businesses } from '../businesses/schemas/businesses.schema';
import { Product } from './schemas/product.schema';
import { ProductSize } from '../product-sizes/schemas/product-size.schema';
import * as QRCode from 'qrcode';
import { CloudinaryService } from 'src/infrastructure/cloudinary/cloudinary.service';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Users.name) private userModel: Model<Users>,
    @InjectModel(Businesses.name) private businessModel: Model<Businesses>,
    @InjectModel(ProductGroup.name)
    private productGroupModel: Model<ProductGroup>,
    @InjectModel(ProductSize.name) private productSizeModel: Model<ProductSize>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createProducts(createProductDto: CreateProductDto, userId: string) {
    try {
      if (
        !createProductDto.amount ||
        createProductDto.amount <= 0 ||
        createProductDto.amount > 1000
      ) {
        throw new HttpException(
          'Amount must be between 1 and 1000',
          HttpStatus.BAD_REQUEST,
        );
      }

      const userObjectId = new Types.ObjectId(userId);
      const productGroupId = new Types.ObjectId(
        createProductDto.productGroupId,
      );
      const productSizeId = new Types.ObjectId(createProductDto.productSizeId);

      const [user, business, productGroup, productSize] = await Promise.all([
        this.userModel.findById(userObjectId),
        this.businessModel.findOne({ userId: userObjectId }),
        this.productGroupModel.findById(productGroupId),
        this.productSizeModel.findById(productSizeId),
      ]);

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      if (!business) {
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);
      }
      if (!productGroup) {
        throw new HttpException(
          'Product group not found',
          HttpStatus.NOT_FOUND,
        );
      }
      if (!productSize) {
        throw new HttpException('Product size not found', HttpStatus.NOT_FOUND);
      }

      const prefix = productGroup.name.slice(0, 3).toUpperCase();
      const timestamp = Date.now();

      const products = await Promise.all(
        Array.from({ length: createProductDto.amount }, async (_, i) => {
          const random = Math.floor(Math.random() * 100000)
            .toString()
            .padStart(5, '0');
          const serialNumber = `${prefix}-${timestamp}-${random}-${i}`;

          const qrCodeBuffer = await QRCode.toBuffer(serialNumber, {
            errorCorrectionLevel: 'H',
            type: 'png',
            width: 300,
            margin: 1,
          });

          const uploadResult = await this.cloudinaryService.uploadQRCode(
            qrCodeBuffer,
            serialNumber,
            'products/qrcodes',
          );

          return {
            productGroupId,
            productSizeId,
            serialNumber,
            qrCode: uploadResult.secure_url,
            condition: 'good',
          };
        }),
      );

      const createdProducts = await this.productModel.insertMany(products);

      return {
        success: true,
        message: 'Products created successfully',
        count: createdProducts.length,
        serialNumbers: createdProducts.map((p) => p.serialNumber),
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to create products',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllProducts(
    userId: string,
    productGroupId: string,
    query: QueryProductDto,
  ) {
    try {
      const business = await this.businessModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!business) {
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);
      }

      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      const filter: Record<string, any> = {
        isDeleted: false,
        productGroupId: new Types.ObjectId(productGroupId),
      };

      if (query.status) {
        filter.status = query.status;
      }

      if (query.search) {
        filter.serialNumber = { $regex: query.search, $options: 'i' };
      }

      const [products, total] = await Promise.all([
        this.productModel
          .find(filter)
          .populate('productGroupId')
          .populate('productSizeId')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        this.productModel.countDocuments(filter),
      ]);

      return {
        success: true,
        data: products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Failed to get products',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getProductBySerialNumber(serialNumber: string) {
    try {
      const product = await this.productModel
        .findOne({ serialNumber, isDeleted: false })
        .populate('productGroupId', 'name description image')
        .populate('productSizeId', 'name description');

      if (!product) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: product,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Failed to get product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getProductById(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new HttpException('Invalid product ID', HttpStatus.BAD_REQUEST);
      }

      const product = await this.productModel
        .findOne({ _id: new Types.ObjectId(id), isDeleted: false })
        .populate('productGroupId', 'name description image')
        .populate('productSizeId', 'name description');

      if (!product) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: product,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Failed to get product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new HttpException('Invalid product ID', HttpStatus.BAD_REQUEST);
      }

      const product = await this.productModel.findOne({
        _id: new Types.ObjectId(id),
        isDeleted: false,
      });

      if (!product) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }

      const updatedProduct = await this.productModel.findByIdAndUpdate(
        id,
        { $set: updateProductDto },
        { new: true },
      );

      return {
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Failed to update product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async softDeleteProduct(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new HttpException('Invalid product ID', HttpStatus.BAD_REQUEST);
      }

      const product = await this.productModel.findOne({
        _id: new Types.ObjectId(id),
        isDeleted: false,
      });

      if (!product) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }

      await this.productModel.findByIdAndUpdate(id, { isDeleted: true });

      return {
        success: true,
        message: 'Product deleted successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Failed to delete product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getProductsForCustomer(
    productGroupId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<APIResponseDto> {
    try {
      const skip = (page - 1) * limit;

      const products = await this.productModel
        .find({
          status: 'available',
          productGroupId: new Types.ObjectId(productGroupId),
        })
        .skip(skip)
        .populate('productSizeId')
        .populate('productGroupId')
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await this.productModel.countDocuments({
        status: 'available',
        productGroupId: new Types.ObjectId(productGroupId),
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Products fetched successfully',
        data: {
          products,
          total,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to fetch products',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
