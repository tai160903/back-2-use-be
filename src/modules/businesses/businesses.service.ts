import { CreateBusinessFormDto } from './dto/create-business-form.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { CloudinaryService } from 'src/infrastructure/cloudinary/cloudinary.service';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
// import { CreateBusinessDto } from './dto/create-business.dto';
// import { UpdateBusinessDto } from './dto/update-business.dto';
import { Businesses } from './schemas/businesses.schema';
import { Connection, Model, Types } from 'mongoose';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { BusinessForm } from './schemas/business-form.schema';
import { Subscriptions } from '../subscriptions/schemas/subscriptions.schema';
import { BusinessSubscriptions } from './schemas/business-subscriptions.schema';
import { Injectable } from '@nestjs/common';
import { Wallets } from '../wallets/schemas/wallets.schema';
import { Users } from '../users/schemas/users.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  WalletTransactions,
  WalletTransactionsDocument,
} from '../wallet-transactions/schema/wallet-transactions.schema';

@Injectable()
export class BusinessesService {
  private readonly logger = new Logger(BusinessesService.name);
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
    private readonly notificationsService: NotificationsService,
    @InjectModel(WalletTransactions.name)
    private readonly walletTransactionsModel: Model<WalletTransactionsDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async buySubscription(
    userId: string,
    subscriptionId: string,
  ): Promise<APIResponseDto> {
    if (!userId)
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    const [business, wallet, subscription] = await Promise.all([
      this.businessesModel.findOne({ userId: new Types.ObjectId(userId) }),
      this.walletsModel.findOne({ userId: new Types.ObjectId(userId) }),
      this.subscriptionModel.findById(subscriptionId),
    ]);

    if (!business)
      throw new HttpException('Business not found', HttpStatus.NOT_FOUND);
    if (!wallet)
      throw new HttpException('Wallet not found', HttpStatus.NOT_FOUND);
    if (!subscription || subscription.isDeleted)
      throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);

    if (subscription.isTrial) {
      const usedTrial = await this.businessSubscriptionModel.findOne({
        businessId: business._id,
        isTrialUsed: true,
      });
      if (usedTrial)
        throw new HttpException('Trial already used', HttpStatus.BAD_REQUEST);
    }

    if (wallet.balance < subscription.price)
      throw new HttpException(
        'Insufficient wallet balance',
        HttpStatus.BAD_REQUEST,
      );

    const activeSub = await this.businessSubscriptionModel
      .findOne({
        businessId: business._id,
        isActive: true,
      })
      .sort({ endDate: -1 });

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      if (activeSub) {
        activeSub.isActive = false;
        await activeSub.save({ session });
      }

      const startDate = activeSub ? activeSub.endDate : new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + subscription.durationInDays);

      const businessSub = new this.businessSubscriptionModel({
        businessId: business._id,
        subscriptionId: subscription._id,
        startDate,
        endDate,
        isActive: true,
        isTrialUsed: !!subscription.isTrial,
      });

      wallet.balance -= subscription.price;

      await Promise.all([
        wallet.save({ session }),
        businessSub.save({ session }),
      ]);

      // Create wallet transaction record for subscription purchase
      const transaction = new this.walletTransactionsModel({
        walletId: wallet._id,
        userId: new Types.ObjectId(userId),
        amount: subscription.price,
        transactionType: 'subscription_fee',
        direction: 'out',
        status: 'completed',
        description: `Purchase subscription ${subscription.name}`,
        referenceType: 'subscription',
        referenceId: businessSub._id,
      });
      await transaction.save({ session });

      await session.commitTransaction();

      await this.notificationsService.create({
        userId,
        title: 'Subscription Purchased',
        message: `You have successfully purchased the ${subscription.name} subscription.`,
        type: 'system',
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Subscription purchased successfully',
        data: businessSub,
      };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
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
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to create business form';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleSubscriptionExpirations() {
    const now = new Date();

    const expiredSubscriptions = await this.businessSubscriptionModel.find({
      endDate: { $lt: now },
      isActive: true,
    });

    this.logger.log(
      `[${now.toISOString()}] Found ${expiredSubscriptions.length} expired subscriptions.`,
    );

    for (const sub of expiredSubscriptions) {
      try {
        sub.isActive = false;
        await sub.save();

        const business = await this.businessesModel.findById(sub.businessId);
        if (business) {
          await this.notificationsService.create({
            userId: business.userId.toString(),
            title: 'Subscription Expired',
            message:
              'Your subscription has expired. Please renew to continue enjoying our services.',
            type: 'system',
          });
        }

        const nextSub = await this.businessSubscriptionModel
          .findOne({
            businessId: sub.businessId,
            startDate: { $gte: sub.endDate },
          })
          .sort({ startDate: 1 });

        if (nextSub) {
          nextSub.isActive = true;
          await nextSub.save();

          if (business) {
            await this.notificationsService.create({
              userId: business.userId.toString(),
              title: 'Subscription Activated',
              message: 'Your new subscription has been activated.',
              type: 'system',
            });
          }
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Error processing subscription ${sub._id.toString()}: ${errMsg}`,
        );
      }
    }

    this.logger.log(
      `[${now.toISOString()}] Processed ${expiredSubscriptions.length} expired subscriptions.`,
    );
  }
}
