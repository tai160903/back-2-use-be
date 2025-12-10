import { ProductGroup } from './../product-groups/schemas/product-group.schema';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Users } from '../users/schemas/users.schema';
import { Model, Types } from 'mongoose';
import { Businesses } from '../businesses/schemas/businesses.schema';
import { BusinessSubscriptions } from '../businesses/schemas/business-subscriptions.schema';
import { Subscriptions } from '../subscriptions/schemas/subscriptions.schema';
import { Product } from './schemas/product.schema';
import { ProductSize } from '../product-sizes/schemas/product-size.schema';
import * as QRCode from 'qrcode';
import { CloudinaryService } from 'src/infrastructure/cloudinary/cloudinary.service';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { BorrowTransaction } from '../borrow-transactions/schemas/borrow-transactions.schema';
import { SystemSetting } from '../system-settings/schemas/system-setting.schema';
import { calculateLateReturnInfo } from '../borrow-transactions/utils/calculate-late-return';
import { ProductFace } from 'src/common/constants/product-face.enum';
import { calculateEcoPoint } from '../borrow-transactions/utils/calculate-eco-point';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Users.name) private userModel: Model<Users>,

    @InjectModel(Businesses.name) private businessModel: Model<Businesses>,

    @InjectModel(BusinessSubscriptions.name)
    private businessSubscriptionModel: Model<BusinessSubscriptions>,

    @InjectModel(Subscriptions.name)
    private subscriptionModel: Model<Subscriptions>,

    @InjectModel(ProductGroup.name)
    private productGroupModel: Model<ProductGroup>,

    @InjectModel(ProductSize.name) private productSizeModel: Model<ProductSize>,

    @InjectModel(Product.name) private productModel: Model<Product>,

    @InjectModel(BorrowTransaction.name)
    private borrowTransactionModel: Model<BorrowTransaction>,

    @InjectModel(SystemSetting.name)
    private systemSettingsModel: Model<SystemSetting>,

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

      // Check subscription limits
      const now = new Date();
      const activeSub = await this.businessSubscriptionModel
        .findOne({
          businessId: new Types.ObjectId(business._id),
          status: 'active',
          startDate: { $lte: now },
          endDate: { $gte: now },
        })
        .populate('subscriptionId')
        .lean();

      if (!activeSub) {
        throw new HttpException(
          'No active subscription found',
          HttpStatus.FORBIDDEN,
        );
      }

      const subscription = activeSub.subscriptionId as any;
      const productItemLimit = subscription?.limits?.productItemLimit ?? 0;

      // Count existing products (available for loan)
      const existingCount = await this.productModel.countDocuments({
        productGroupId,
        status: { $in: ['available', 'borrowed'] },
      });

      const newTotal = existingCount + createProductDto.amount;

      // Check if limit would be exceeded (-1 means unlimited)
      if (productItemLimit !== -1 && newTotal > productItemLimit) {
        const remaining = Math.max(0, productItemLimit - existingCount);
        throw new HttpException(
          `Product loan limit would be exceeded. Your plan allows ${productItemLimit} product${productItemLimit !== 1 ? 's' : ''} for loan. You currently have ${existingCount} and can add ${remaining} more. Upgrade your subscription to create more.`,
          HttpStatus.FORBIDDEN,
        );
      }

      const FACE_LIST = Object.values(ProductFace);

      const prefix = productGroup.name.slice(0, 3).toUpperCase().padEnd(3, 'X');
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

          const lastConditionImages = {
            topImage: productGroup.imageUrl,
            bottomImage: productGroup.imageUrl,
            frontImage: productGroup.imageUrl,
            backImage: productGroup.imageUrl,
            leftImage: productGroup.imageUrl,
            rightImage: productGroup.imageUrl,
          };

          const lastDamageFaces = FACE_LIST.map((f) => ({
            face: f,
            issue: 'none',
          }));

          return {
            productGroupId,
            productSizeId,
            serialNumber,
            qrCode: uploadResult.secure_url,
            condition: 'good',
            lastConditionImages,
            lastDamageFaces,
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

      if (query.status) filter.status = query.status;
      if (query.search)
        filter.serialNumber = { $regex: query.search, $options: 'i' };

      const [products, total] = await Promise.all([
        this.productModel
          .find(filter)
          .populate({
            path: 'productGroupId',
            populate: {
              path: 'materialId',
              select: 'co2EmissionPerKg',
            },
          })
          .populate('productSizeId')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        this.productModel.countDocuments(filter),
      ]);

      const finalProducts = products.map((p: any) => {
        const size = p.productSizeId;
        const material = p.productGroupId?.materialId;

        let ecoPoint = 0;
        let co2Reduced = 0;
        let plasticPrevented = 0;

        if (size && material) {
          const eco = calculateEcoPoint(size, material);
          // ecoPoint = eco.ecoPoint;
          co2Reduced = eco.co2Reduced;
          // plasticPrevented = eco.plasticPrevented;
        }

        return {
          ...p.toObject(),
          // ecoPoint,
          co2Reduced,
          // plasticPrevented,
        };
      });

      return {
        success: true,
        data: finalProducts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error?.message || 'Failed to get products',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getProductBySerialNumber(serialNumber: string) {
    try {
      const product = await this.productModel
        .findOne({ serialNumber, isDeleted: false })
        .select(
          '_id serialNumber qrCode status condition reuseCount lastConditionImages lastConditionNote lastDamageFaces',
        )
        .populate({
          path: 'productGroupId',
          populate: {
            path: 'materialId',
            select: 'co2EmissionPerKg',
          },
        })
        .populate('productSizeId');

      if (!product) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }

      let co2Reduced = 0;

      const size: any = product.productSizeId;
      const group: any = product.productGroupId;

      if (size && group?.materialId) {
        const eco = calculateEcoPoint(size, group.materialId);
        co2Reduced = eco.co2Reduced;
      }

      const activeTransaction = await this.borrowTransactionModel
        .findOne({
          productId: product._id,
          status: { $in: ['pending_pickup', 'borrowing', 'rejected', 'lost'] },
        })
        .populate('customerId', 'fullName phone yob address')
        .populate(
          'businessId',
          'businessName businessMail businessPhone businessAddress openTime closeTime businessLogoUrl',
        );

      let lateInfo: any = null;

      if (
        activeTransaction &&
        ['borrowing', 'lost'].includes(activeTransaction.status)
      ) {
        const borrowPolicy = await this.systemSettingsModel.findOne({
          category: 'borrow',
          key: 'borrow_policy',
        });

        if (!borrowPolicy) {
          throw new HttpException(
            'Borrow policy not found',
            HttpStatus.NOT_FOUND,
          );
        }

        lateInfo = calculateLateReturnInfo(
          activeTransaction,
          borrowPolicy.value,
        );
      }

      return {
        success: true,
        data: {
          product: {
            ...product.toObject(),
            co2Reduced, // 🌱 thêm vào response
          },
          transaction: activeTransaction || null,
          lateInfo: lateInfo || null,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;

      throw new HttpException(
        error.message || 'Failed to get product',
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
        .populate({
          path: 'productGroupId',
          populate: {
            path: 'materialId',
            select: 'co2EmissionPerKg',
          },
        })
        .populate('productSizeId');

      if (!product) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }

      const group: any = product.productGroupId;
      const size: any = product.productSizeId;
      const material = group?.materialId;

      let co2Reduced = 0;

      if (size && material) {
        const eco = calculateEcoPoint(size, material);
        co2Reduced = eco.co2Reduced;
      }

      return {
        success: true,
        data: {
          ...product.toObject(),
          co2Reduced,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error?.message || 'Failed to get product',
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
    status?: string,
    condition?: string,
  ): Promise<APIResponseDto> {
    try {
      const skip = (page - 1) * limit;

      const filter: Record<string, any> = {
        productGroupId: new Types.ObjectId(productGroupId),
        isDeleted: false,
      };

      if (status) filter.status = status;
      else filter.status = 'available';

      if (condition) filter.condition = condition;

      const [products, total] = await Promise.all([
        this.productModel
          .find(filter)
          .populate({
            path: 'productGroupId',
            populate: {
              path: 'materialId',
              select: 'co2EmissionPerKg',
            },
          })
          .populate('productSizeId')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        this.productModel.countDocuments(filter),
      ]);

      const finalProducts = products.map((p: any) => {
        const size = p.productSizeId;
        const material = p.productGroupId?.materialId;

        let co2Reduced = 0;

        if (size && material) {
          const eco = calculateEcoPoint(size, material);
          co2Reduced = eco.co2Reduced;
        }

        return {
          ...p.toObject(),
          co2Reduced,
        };
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Products fetched successfully',
        data: {
          products: finalProducts,
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
