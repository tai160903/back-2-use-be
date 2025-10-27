import { CreateBusinessFormDto } from './dto/create-business-form.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { CloudinaryService } from 'src/infrastructure/cloudinary/cloudinary.service';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
// import { CreateBusinessDto } from './dto/create-business.dto';
// import { UpdateBusinessDto } from './dto/update-business.dto';

import { Businesses } from './schemas/businesses.schema';
import { Connection, Model, PipelineStage, Types } from 'mongoose';
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
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { BusinessProjectionStage, UserLookupStage } from 'src/common/pipelines';
import { GetAllBusinessesDto } from './dto/get-all-businesses.dto';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { aggregatePaginate } from 'src/common/utils/aggregate-pagination.util';
import { MailerService } from 'src/infrastructure/mailer/mailer.service';
import { subscriptionPurchasedTemplate } from 'src/infrastructure/mailer/templates/subscription-purchased.template';
import { subscriptionExpiredTemplate } from 'src/infrastructure/mailer/templates/subscription-expired.template';
import { subscriptionActivatedTemplate } from 'src/infrastructure/mailer/templates/subscription-activated.template';
import { subscriptionExpiringSoonTemplate } from 'src/infrastructure/mailer/templates/subscription-expiring-soon.template';

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
    private mailerService: MailerService,
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
      const now = new Date();

      let startDate = now;
      if (activeSub && activeSub.endDate > now) {
        // Có gói đang chạy -> gói mới sẽ chờ đến khi gói hiện tại kết thúc
        startDate = activeSub.endDate;
      }

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + subscription.durationInDays);

      const businessSub = new this.businessSubscriptionModel({
        businessId: business._id,
        subscriptionId: subscription._id,
        startDate,
        endDate,
        isActive: startDate <= now, // chỉ active ngay nếu không có gói hiện tại
        isTrialUsed: !!subscription.isTrial,
      });

      wallet.balance -= subscription.price;
      if (wallet.balance < 0)
        throw new HttpException(
          'Insufficient wallet balance',
          HttpStatus.BAD_REQUEST,
        );

      await Promise.all([
        wallet.save({ session }),
        businessSub.save({ session }),
      ]);

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

      // Send notification
      await this.notificationsService.create({
        userId,
        title: 'Subscription Purchased',
        message: `You have successfully purchased the ${subscription.name} subscription.${activeSub ? ' It will activate after your current plan ends.' : ''}`,
        type: 'system',
      });

      // Send email
      const user = await this.usersModel.findById(userId);
      this.logger.log(
        `Preparing to send purchase email to: ${user?.email || 'NO EMAIL'} for business: ${business.businessName}`,
      );

      if (user?.email) {
        try {
          await this.mailerService.sendMail({
            to: [{ address: user.email, name: business.businessName }],
            subject: 'Subscription Purchased Successfully',
            html: subscriptionPurchasedTemplate(
              business.businessName,
              subscription.name,
              businessSub.startDate.toDateString(),
              businessSub.endDate.toDateString(),
              !!activeSub,
            ),
          });
          this.logger.log(`Successfully sent purchase email to ${user.email}`);
        } catch (emailError) {
          const errMsg =
            emailError instanceof Error
              ? emailError.message
              : String(emailError);
          this.logger.error(
            `Failed to send purchase email to ${user.email}: ${errMsg}`,
          );
        }
      } else {
        this.logger.warn(
          `No email found for user ${userId}, business: ${business.businessName}`,
        );
      }

      return {
        statusCode: HttpStatus.CREATED,
        message: activeSub
          ? 'Subscription scheduled to activate after current plan expires'
          : 'Subscription activated successfully',
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
  async handleSubscriptionsLifecycle() {
    const now = new Date();

    // 1️⃣ Deactivate expired subscriptions
    const expiredSubs = await this.businessSubscriptionModel.find({
      endDate: { $lt: now },
      isActive: true,
    });

    this.logger.log(
      `[${now.toISOString()}] Found ${expiredSubs.length} expired subscriptions.`,
    );

    for (const sub of expiredSubs) {
      try {
        sub.isActive = false;
        await sub.save();

        const business = await this.businessesModel.findById(sub.businessId);

        if (business) {
          const subscription = await this.subscriptionModel.findById(
            sub.subscriptionId,
          );

          // Send notification
          await this.notificationsService.create({
            userId: business.userId.toString(),
            title: 'Subscription Expired',
            message:
              'Your subscription has expired. Please renew to continue using our services.',
            type: 'system',
          });

          // Send email
          const user = await this.usersModel.findById(business.userId);
          this.logger.log(
            `Preparing to send expired email to: ${user?.email || 'NO EMAIL'}`,
          );

          if (user?.email && subscription) {
            try {
              await this.mailerService.sendMail({
                to: [{ address: user.email, name: business.businessName }],
                subject: 'Subscription Expired',
                html: subscriptionExpiredTemplate(
                  business.businessName,
                  subscription.name,
                  sub.endDate.toDateString(),
                ),
              });
              this.logger.log(
                `Successfully sent expired email to ${user.email}`,
              );
            } catch (emailError) {
              const errMsg =
                emailError instanceof Error
                  ? emailError.message
                  : String(emailError);
              this.logger.error(
                `Failed to send expired email to ${user.email}: ${errMsg}`,
              );
            }
          } else {
            this.logger.warn(
              `No email or subscription found for business ${business._id.toString()}`,
            );
          }
        }

        // Find next subscription for this business (the one that should start next)
        const nextSub = await this.businessSubscriptionModel
          .findOne({
            businessId: sub.businessId,
            startDate: { $lte: now }, // ensure it’s ready to start
            isActive: false,
          })
          .sort({ startDate: 1 })
          .limit(1);

        if (nextSub) {
          nextSub.isActive = true;
          await nextSub.save();

          if (business) {
            const nextSubscription = await this.subscriptionModel.findById(
              nextSub.subscriptionId,
            );

            // Send notification
            await this.notificationsService.create({
              userId: business.userId.toString(),
              title: 'Subscription Activated',
              message: 'Your new subscription has been activated.',
              type: 'system',
            });

            // Send email
            const user = await this.usersModel.findById(business.userId);
            this.logger.log(
              `Preparing to send activation email (after expired) to: ${user?.email || 'NO EMAIL'}`,
            );

            if (user?.email && nextSubscription) {
              try {
                await this.mailerService.sendMail({
                  to: [{ address: user.email, name: business.businessName }],
                  subject: 'Subscription Activated',
                  html: subscriptionActivatedTemplate(
                    business.businessName,
                    nextSubscription.name,
                    nextSub.startDate.toDateString(),
                    nextSub.endDate.toDateString(),
                  ),
                });
                this.logger.log(
                  `Successfully sent activation email to ${user.email}`,
                );
              } catch (emailError) {
                const errMsg =
                  emailError instanceof Error
                    ? emailError.message
                    : String(emailError);
                this.logger.error(
                  `Failed to send activation email to ${user.email}: ${errMsg}`,
                );
              }
            } else {
              this.logger.warn(
                `No email or subscription found for business ${business._id.toString()}`,
              );
            }
          }
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Error processing subscription ${sub._id.toString()}: ${errMsg}`,
        );
      }
    }

    // 2️⃣ Activate any pending subscriptions that are ready but not yet active
    const pendingSubs = await this.businessSubscriptionModel.find({
      startDate: { $lte: now },
      isActive: false,
    });

    for (const sub of pendingSubs) {
      try {
        // Only activate if there's no active subscription for this business
        const hasActive = await this.businessSubscriptionModel.exists({
          businessId: sub.businessId,
          isActive: true,
        });

        if (!hasActive) {
          sub.isActive = true;
          await sub.save();

          const business = await this.businessesModel.findById(sub.businessId);
          if (business) {
            const subscription = await this.subscriptionModel.findById(
              sub.subscriptionId,
            );

            // Send notification
            await this.notificationsService.create({
              userId: business.userId.toString(),
              title: 'Subscription Activated',
              message: 'Your subscription has been activated.',
              type: 'system',
            });

            // Send email
            const user = await this.usersModel.findById(business.userId);
            if (user?.email && subscription) {
              await this.mailerService.sendMail({
                to: [{ address: user.email, name: business.businessName }],
                subject: 'Subscription Activated',
                html: subscriptionActivatedTemplate(
                  business.businessName,
                  subscription.name,
                  sub.startDate.toDateString(),
                  sub.endDate.toDateString(),
                ),
              });
            }
          }
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Error activating subscription ${sub._id.toString()}: ${errMsg}`,
        );
      }
    }

    this.logger.log(
      `[${now.toISOString()}] Processed ${expiredSubs.length} expired and ${pendingSubs.length} pending subscriptions.`,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  // @Cron(CronExpression.EVERY_5_SECONDS)
  async notifyExpiringSubscriptions() {
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const expiringSubs = await this.businessSubscriptionModel.find({
      isActive: true,
      isExpiringNotified: { $ne: true },
      endDate: { $gte: now, $lte: threeDaysLater },
    });
    this.logger.log(
      `[${now.toISOString()}] Found ${expiringSubs.length} subscriptions expiring within 3 days.`,
    );

    for (const sub of expiringSubs) {
      try {
        const business = await this.businessesModel.findById(sub.businessId);
        const subscription = await this.subscriptionModel.findById(
          sub.subscriptionId,
        );
        if (!business || !subscription) continue;

        const daysRemaining = Math.ceil(
          (sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Send notification
        await this.notificationsService.create({
          userId: business.userId.toString(),
          title: 'Subscription Expiring Soon',
          message: `Your ${subscription.name} subscription will expire on ${sub.endDate.toDateString()}. Please renew soon to avoid interruption.`,
          type: 'system',
        });

        // Send email
        const user = await this.usersModel.findById(business.userId);
        this.logger.log(
          `Preparing to send expiring email to: ${user?.email || 'NO EMAIL'}`,
        );

        if (user?.email) {
          try {
            await this.mailerService.sendMail({
              to: [{ address: user.email, name: business.businessName }],
              subject: 'Subscription Expiring Soon',
              html: subscriptionExpiringSoonTemplate(
                business.businessName,
                subscription.name,
                sub.endDate.toDateString(),
                daysRemaining,
              ),
            });
            this.logger.log(
              `Successfully sent expiring email to ${user.email}`,
            );
          } catch (emailError) {
            const errMsg =
              emailError instanceof Error
                ? emailError.message
                : String(emailError);
            this.logger.error(
              `Failed to send email to ${user.email}: ${errMsg}`,
            );
          }
        } else {
          this.logger.warn(
            `⚠️ No email found for business ${business._id.toString()}`,
          );
        }

        sub.isExpiringNotified = true;
        sub.expiringNotifiedAt = new Date();
        await sub.save();

        this.logger.log(
          `Notified business ${business._id.toString()} about subscription ${subscription.name} expiring.`,
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Error notifying expiring subscription ${sub._id.toString()}: ${errMsg}`,
        );
      }
    }

    this.logger.log(
      `[${now.toISOString()}] Completed notifying expiring subscriptions.`,
    );
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

    const total =
      (totalResult[0] as { total?: number } | undefined)?.total || 0;

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
