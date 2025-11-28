import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProductGroupDto } from './dto/create-product-group.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ProductGroup } from '../product-groups/schemas/product-group.schema';
import { Model, Types } from 'mongoose';
import { Users } from '../users/schemas/users.schema';
import { Businesses } from '../businesses/schemas/businesses.schema';
import { BusinessSubscriptions } from '../businesses/schemas/business-subscriptions.schema';
import { Subscriptions } from '../subscriptions/schemas/subscriptions.schema';
import { CloudinaryService } from 'src/infrastructure/cloudinary/cloudinary.service';

@Injectable()
export class ProductGroupsService {
  constructor(
    @InjectModel(ProductGroup.name)
    private productGroupModel: Model<ProductGroup>,
    @InjectModel(Users.name) private userModel: Model<Users>,
    @InjectModel(Businesses.name) private businessModel: Model<Businesses>,
    @InjectModel(BusinessSubscriptions.name)
    private businessSubscriptionModel: Model<BusinessSubscriptions>,
    @InjectModel(Subscriptions.name)
    private subscriptionModel: Model<Subscriptions>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  async getAllProductGroupsByBusiness(
    userId: string,
    limit: number,
    page: number,
  ) {
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

    const productGroups = await this.productGroupModel
      .find({ businessId: business._id, isDeleted: false })
      .populate('materialId')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    if (!productGroups) {
      throw new HttpException('Product groups not found', HttpStatus.NOT_FOUND);
    }

    const total = await this.productGroupModel.countDocuments({
      businessId: business._id,
      isDeleted: false,
    });

    const totalPages = Math.ceil(total / limit);
    return {
      statusCode: HttpStatus.OK,
      message: 'Product groups fetched successfully',
      data: productGroups,
      total,
      totalPages,
      currentPage: page,
    };
  }

  async createProductGroup(
    createProductGroupDto: CreateProductGroupDto,
    userId: string,
    file?: Express.Multer.File,
  ) {
    try {
      if (!file) {
        throw new HttpException('Image is required', HttpStatus.BAD_REQUEST);
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
      const productGroupLimit = subscription?.limits?.productGroupLimit ?? 0;

      // Count existing product groups
      const existingCount = await this.productGroupModel.countDocuments({
        businessId: new Types.ObjectId(business._id),
        isDeleted: false,
      });

      // Check if limit reached (-1 means unlimited)
      if (productGroupLimit !== -1 && existingCount >= productGroupLimit) {
        throw new HttpException(
          `Product group limit reached. Your plan allows ${productGroupLimit} product group${productGroupLimit !== 1 ? 's' : ''}. Upgrade your subscription to create more.`,
          HttpStatus.FORBIDDEN,
        );
      }

      const existingProductGroup = await this.productGroupModel.findOne({
        businessId: new Types.ObjectId(business._id),
        name: createProductGroupDto.name,
        isDeleted: false,
      });

      if (existingProductGroup) {
        throw new HttpException(
          'Product group with this name already exists',
          HttpStatus.BAD_REQUEST,
        );
      }

      let imageUrl: string | undefined;

      if (file) {
        const uploadResult = await this.cloudinaryService.uploadFile(
          file,
          'products/groups',
        );
        imageUrl = String(uploadResult.secure_url);
      }

      const createdProductGroup = await this.productGroupModel.create({
        ...createProductGroupDto,
        materialId: new Types.ObjectId(createProductGroupDto.materialId),
        businessId: business._id,
        imageUrl,
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Product group created successfully',
        data: createdProductGroup,
      };
    } catch (error) {
      throw new HttpException(
        (error as Error)?.message || 'Failed to create product group',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
