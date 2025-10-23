import { CreateBusinessFormDto } from './dto/create-business-form.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { CloudinaryService } from 'src/infrastructure/cloudinary/cloudinary.service';
import { HttpException, HttpStatus } from '@nestjs/common';
// import { CreateBusinessDto } from './dto/create-business.dto';
// import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessDocument, Businesses } from './schemas/businesses.schema';
import { Model, PipelineStage, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { BusinessForm } from './schemas/business-form.schema';
import { Subscriptions } from '../subscriptions/schemas/subscriptions.schema';
import { BusinessSubscriptions } from './schemas/business-subscriptions.schema';
import { Injectable } from '@nestjs/common';
import { Wallets } from '../wallets/schemas/wallets.schema';
import { Users } from '../users/schemas/users.schema';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { BusinessProjectionStage, UserLookupStage } from 'src/common/pipelines';
import { GetAllBusinessesDto } from './dto/get-all-businesses.dto';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { aggregatePaginate } from 'src/common/utils/aggregate-pagination.util';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectModel(Businesses.name) private businessesModel: Model<Businesses>,
    @InjectModel(BusinessForm.name)
    private businessFormModel: Model<BusinessForm>,
    @InjectModel(Subscriptions.name)
    private subscriptionModel: Model<Subscriptions>,
    @InjectModel(BusinessSubscriptions.name)
    private businessSubscriptionModel: Model<BusinessSubscriptions>,
    @InjectModel(Wallets.name) private walletsModel: Model<Wallets>,
    @InjectModel(Users.name) private usersModel: Model<Users>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async buySubscription(
    userId: string,
    subscriptionId: string,
  ): Promise<APIResponseDto> {
    try {
      if (!userId) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      const business = await this.businessesModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .exec();
      if (!business) {
        throw new HttpException(
          'Business not found for user',
          HttpStatus.NOT_FOUND,
        );
      }

      const wallet = await this.walletsModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .exec();
      if (!wallet || wallet.balance <= 0) {
        throw new HttpException(
          'Insufficient wallet balance',
          HttpStatus.BAD_REQUEST,
        );
      }

      const subscription = await this.subscriptionModel
        .findById(subscriptionId)
        .exec();
      if (!subscription || subscription.isDeleted) {
        throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
      }

      if (subscription.isTrial) {
        const usedTrial = await this.businessSubscriptionModel
          .findOne({ businessId: business._id, isTrialUsed: true })
          .exec();
        if (usedTrial) {
          throw new HttpException(
            'This business has already used a trial subscription',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      if (subscription.price > wallet.balance) {
        throw new HttpException(
          'Insufficient wallet balance',
          HttpStatus.BAD_REQUEST,
        );
      }

      const active = await this.businessSubscriptionModel
        .findOne({ businessId: business._id, endDate: { $gte: new Date() } })
        .sort({ endDate: -1 })
        .exec();
      const startDate = active ? active.endDate : new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + subscription.durationInDays);

      wallet.balance -= subscription.price;
      await wallet.save();

      const businessSub = new this.businessSubscriptionModel({
        businessId: business._id,
        subscriptionId: subscription._id,
        startDate,
        endDate,
        isActive: true,
        isTrialUsed: !!subscription.isTrial,
      });

      await businessSub.save();

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Subscription purchased successfully',
        data: businessSub,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to purchase subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getFormDetail(id: string): Promise<APIResponseDto> {
    try {
      const form = await this.businessesModel.findOne({
        businessFormId: new Types.ObjectId(id),
      });
      if (!form) {
        return {
          statusCode: 404,
          message: 'Business form not found',
        };
      }
      return {
        statusCode: 200,
        message: 'Fetched business form detail',
        data: form,
      };
    } catch (error) {
      let message: string;
      if (error && (error as Error).message) {
        message = (error as Error).message;
      } else {
        message = String(error);
      }
      return {
        statusCode: 500,
        message: 'Error fetching business form detail',
        data: message,
      };
    }
  }

  async createForm(
    dto: CreateBusinessFormDto,
    files?: {
      businessLogo?: Express.Multer.File[];
      foodSafetyCertUrl?: Express.Multer.File[];
      businessLicenseFile?: Express.Multer.File[];
    },
  ): Promise<APIResponseDto> {
    const MAX_FILE_SIZE_MB = 5;
    try {
      // require files
      if (
        !files ||
        !files.businessLogo ||
        files.businessLogo.length === 0 ||
        !files.foodSafetyCertUrl ||
        files.foodSafetyCertUrl.length === 0 ||
        !files.businessLicenseFile ||
        files.businessLicenseFile.length === 0
      ) {
        throw new HttpException(
          'businessLogo, foodSafetyCertUrl, and businessLicenseFile are required.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf',
      ];
      const allowedLogoTypes = ['image/jpeg', 'image/png', 'image/jpg'];

      const businessLogoFile = files.businessLogo[0];
      const foodSafetyCertFile = files.foodSafetyCertUrl[0];
      const businessLicenseFile = files.businessLicenseFile[0];

      if (foodSafetyCertFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        throw new HttpException(
          `File too large. Maximum allowed is ${MAX_FILE_SIZE_MB}MB`,
          HttpStatus.PAYLOAD_TOO_LARGE,
        );
      }
      if (businessLicenseFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        throw new HttpException(
          `File too large. Maximum allowed is ${MAX_FILE_SIZE_MB}MB`,
          HttpStatus.PAYLOAD_TOO_LARGE,
        );
      }
      if (businessLogoFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        throw new HttpException(
          `File too large. Maximum allowed is ${MAX_FILE_SIZE_MB}MB`,
          HttpStatus.PAYLOAD_TOO_LARGE,
        );
      }

      if (!allowedTypes.includes(foodSafetyCertFile.mimetype)) {
        throw new HttpException(
          'foodSafetyCertUrl must be jpg, jpeg, png, or pdf',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!allowedTypes.includes(businessLicenseFile.mimetype)) {
        throw new HttpException(
          'businessLicenseFile must be jpg, jpeg, png, or pdf',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!allowedLogoTypes.includes(businessLogoFile.mimetype)) {
        throw new HttpException(
          'businessLogo must be jpg, jpeg, or png',
          HttpStatus.BAD_REQUEST,
        );
      }

      const existingForm = await this.usersModel.findOne({
        email: dto.businessMail,
      });

      if (existingForm) {
        throw new HttpException(
          'This email is already approved for a business',
          HttpStatus.BAD_REQUEST,
        );
      }

      // upload files to Cloudinary
      const logoRes = await this.cloudinaryService.uploadFile(
        businessLogoFile,
        'business/logos',
      );
      const foodSafetyRes = await this.cloudinaryService.uploadFile(
        foodSafetyCertFile,
        'business/forms',
      );
      const licenseRes = await this.cloudinaryService.uploadFile(
        businessLicenseFile,
        'business/forms',
      );

      const businessFormData = {
        ...dto,
        status: 'pending',
        businessLogoUrl: String(logoRes.secure_url),
        foodSafetyCertUrl: String(foodSafetyRes.secure_url),
        businessLicenseUrl: String(licenseRes.secure_url),
      };

      const business = new this.businessFormModel(businessFormData);
      await business.save();
      return {
        statusCode: 201,
        message: 'Business form created successfully',
        data: business,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create business form',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get all businesses
  async getAllBusinesses(
    query: GetAllBusinessesDto,
  ): Promise<APIPaginatedResponseDto<Businesses[]>> {
    const { page = 1, limit = 10 } = query;

    const pipeline: PipelineStage[] = [
      UserLookupStage,
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          'user.role': RolesEnum.BUSINESS,
          'user.isBlocked': false,
        },
      },
      BusinessProjectionStage,
    ];

    const result = await aggregatePaginate(
      this.businessesModel,
      pipeline,
      page,
      limit,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Get active businesses successfully',
      data: result.data,
      total: result.total,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
    };
  }

  // Get nearby businesses
  async findNearby(
    latitude: number,
    longitude: number,
    radius: number = 2000,
    page: number = 1,
    limit: number = 10,
  ): Promise<APIPaginatedResponseDto<Businesses[]>> {
    const skip = (page - 1) * limit;

    const pipeline: PipelineStage[] = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'distance',
          maxDistance: radius,
          spherical: true,
          distanceMultiplier: 1,
        },
      },
      UserLookupStage,
      { $unwind: '$user' },
      { $match: { 'user.isBlocked': false } },
      BusinessProjectionStage,
      { $skip: skip },
      { $limit: limit },
    ];

    const countPipeline: PipelineStage[] = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'distance',
          maxDistance: radius,
          spherical: true,
        },
      },
      UserLookupStage,
      { $unwind: '$user' },
      { $match: { 'user.isBlocked': false } },
      { $count: 'total' },
    ];

    const [data, totalResult] = await Promise.all([
      this.businessesModel.aggregate(pipeline),
      this.businessesModel.aggregate(countPipeline),
    ]);

    const total = totalResult[0]?.total || 0;

    return {
      statusCode: HttpStatus.OK,
      message: 'Get nearby businesses successfully',
      data,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
