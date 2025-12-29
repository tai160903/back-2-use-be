import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  RewardPointsPackage,
  RewardPointsPackageDocument,
} from '../schemas/reward-points-package.schema';
import {
  RewardPointsPurchaseHistory,
  RewardPointsPurchaseHistoryDocument,
} from '../schemas/reward-points-purchase-history.schema';
import { CreateRewardPointsPackageDto } from '../dto/create-reward-points-package.dto';
import { UpdateRewardPointsPackageDto } from '../dto/update-reward-points-package.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { paginate } from 'src/common/utils/pagination.util';
import {
  Businesses,
  BusinessDocument,
} from 'src/modules/businesses/schemas/businesses.schema';
import {
  Wallets,
  WalletsDocument,
} from 'src/modules/wallets/schemas/wallets.schema';
import { WalletTransactions } from 'src/modules/wallet-transactions/schema/wallet-transactions.schema';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { MailerService } from 'src/infrastructure/mailer/mailer.service';
import { rewardPointsPurchasedTemplate } from 'src/infrastructure/mailer/templates/reward-points-purchased.template';
import { Users } from 'src/modules/users/schemas/users.schema';
import { Logger } from '@nestjs/common';
import { TransactionType } from 'src/common/constants/transaction-type.enum';
import { WalletReferenceType } from 'src/common/constants/wallet-reference-type.enum';

@Injectable()
export class RewardPointsPackagesService {
  private readonly logger = new Logger(RewardPointsPackagesService.name);

  constructor(
    @InjectModel(RewardPointsPackage.name)
    private readonly rewardPointsPackageModel: Model<RewardPointsPackageDocument>,
    @InjectModel(RewardPointsPurchaseHistory.name)
    private readonly purchaseHistoryModel: Model<RewardPointsPurchaseHistoryDocument>,
    @InjectModel(Businesses.name)
    private readonly businessesModel: Model<BusinessDocument>,
    @InjectModel(Wallets.name)
    private readonly walletsModel: Model<WalletsDocument>,
    @InjectModel(WalletTransactions.name)
    private readonly walletTransactionsModel: Model<WalletTransactions>,
    @InjectModel(Users.name)
    private readonly usersModel: Model<Users>,
    private readonly mailerService: MailerService,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  // ============ ADMIN ENDPOINTS ============

  async createPackage(
    dto: CreateRewardPointsPackageDto,
  ): Promise<APIResponseDto<RewardPointsPackage>> {
    try {
      const newPackage = new this.rewardPointsPackageModel({
        ...dto,
        isActive: true,
      });

      await newPackage.save();

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Reward points package created successfully',
        data: newPackage,
      };
    } catch (error) {
      throw new HttpException(
        (error as Error)?.message || 'Error creating reward points package',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updatePackage(
    id: string,
    dto: UpdateRewardPointsPackageDto,
  ): Promise<APIResponseDto<RewardPointsPackage>> {
    try {
      const pkg = await this.rewardPointsPackageModel.findById(id);

      if (!pkg) {
        throw new NotFoundException('Reward points package not found');
      }

      Object.assign(pkg, dto);
      await pkg.save();

      return {
        statusCode: HttpStatus.OK,
        message: 'Reward points package updated successfully',
        data: pkg,
      };
    } catch (error) {
      throw new HttpException(
        (error as Error)?.message || 'Error updating reward points package',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPackages(
    page: number = 1,
    limit: number = 10,
  ): Promise<APIPaginatedResponseDto<RewardPointsPackage[]>> {
    try {
      const filter = { isDeleted: { $ne: true } };

      const { data, total, currentPage, totalPages } =
        await paginate<RewardPointsPackageDocument>(
          this.rewardPointsPackageModel,
          filter,
          page,
          limit,
        );

      return {
        statusCode: HttpStatus.OK,
        message: 'Packages fetched successfully',
        data,
        total,
        currentPage,
        totalPages,
      };
    } catch (error) {
      throw new HttpException(
        (error as Error)?.message || 'Error fetching packages',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deletePackage(id: string): Promise<APIResponseDto> {
    try {
      const pkg = await this.rewardPointsPackageModel.findById(id);

      if (!pkg) {
        throw new NotFoundException('Reward points package not found');
      }

      pkg.isDeleted = true;
      await pkg.save();

      return {
        statusCode: HttpStatus.OK,
        message: 'Reward points package deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        (error as Error)?.message || 'Error deleting reward points package',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============ BUSINESS ENDPOINTS ============

  async getActivePackages(): Promise<APIResponseDto<RewardPointsPackage[]>> {
    try {
      const packages = await this.rewardPointsPackageModel
        .find({ isActive: true, isDeleted: { $ne: true } })
        .sort({ price: 1 });

      return {
        statusCode: HttpStatus.OK,
        message: 'Active packages fetched successfully',
        data: packages,
      };
    } catch (error) {
      throw new HttpException(
        (error as Error)?.message || 'Error fetching packages',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async buyRewardPointsPackage(
    userId: string,
    packageId: string,
  ): Promise<APIResponseDto> {
    const session = await this.connection.startSession();
    session.startTransaction();

    console.log(userId);
    try {
      const [business, wallet, pkg] = await Promise.all([
        this.businessesModel.findOne({ userId: new Types.ObjectId(userId) }),
        this.walletsModel.findOne({
          userId: new Types.ObjectId(userId),
          type: 'business',
        }),
        this.rewardPointsPackageModel.findById(packageId),
      ]);

      if (!business) {
        throw new NotFoundException('Business not found');
      }

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      if (!pkg || pkg.isDeleted) {
        throw new NotFoundException('Reward points package not found');
      }

      if (!pkg.isActive) {
        throw new BadRequestException('This package is not available');
      }

      if (wallet.availableBalance < pkg.price) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      // Deduct from wallet
      wallet.availableBalance -= pkg.price;
      await wallet.save({ session });

      // Add reward points to business
      business.rewardPoints += pkg.points;
      business.maxRewardPoints += pkg.points;
      await business.save({ session });

      // Create wallet transaction
      const transaction = new this.walletTransactionsModel({
        walletId: wallet._id,
        amount: pkg.price,
        transactionType: TransactionType.REWARD_POINTS_PURCHASE,
        direction: 'out',
        status: 'completed',
        description: `Purchase ${pkg.name} (${pkg.points} points)`,
        referenceType: WalletReferenceType.MANUAL,
        referenceId: new Types.ObjectId(packageId),
        balanceType: 'available',
      });
      await transaction.save({ session });

      // Create purchase history record
      const purchaseHistory = new this.purchaseHistoryModel({
        businessId: business._id,
        packageId: new Types.ObjectId(packageId),
        packageName: pkg.name,
        points: pkg.points,
        amount: pkg.price,
        transactionId: transaction._id,
        status: 'completed',
      });
      await purchaseHistory.save({ session });

      await session.commitTransaction();

      // Send email notification
      const user = await this.usersModel.findById(userId);
      if (user?.email) {
        try {
          await this.mailerService.sendMail({
            to: [
              { address: business.businessMail, name: business.businessName },
            ],
            subject: 'Reward Points Purchased Successfully',
            html: rewardPointsPurchasedTemplate(
              business.businessName,
              pkg.name,
              pkg.points,
              pkg.price,
            ),
          });
        } catch (emailError) {
          this.logger.error(
            `Failed to send reward points purchase email to ${user.email}: ${emailError instanceof Error ? emailError.message : String(emailError)}`,
          );
        }
      }

      return {
        statusCode: HttpStatus.OK,
        message: `Successfully purchased ${pkg.name}. Added ${pkg.points} reward points.`,
        data: {
          packageName: pkg.name,
          pointsAdded: pkg.points,
          currentRewardPoints: business.rewardPoints,
          maxRewardPoints: business.maxRewardPoints,
          walletBalance: wallet.availableBalance,
        },
      };
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw new HttpException(
        (error as Error)?.message || 'Error purchasing reward points package',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.endSession();
    }
  }

  async getBusinessRewardPointsInfo(userId: string): Promise<APIResponseDto> {
    try {
      const business = await this.businessesModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!business) {
        throw new NotFoundException('Business not found');
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Business reward points info fetched successfully',
        data: {
          currentRewardPoints: business.rewardPoints,
          maxRewardPoints: business.maxRewardPoints,
          usedRewardPoints: business.maxRewardPoints - business.rewardPoints,
          percentageUsed:
            business.maxRewardPoints > 0
              ? Math.round(
                  ((business.maxRewardPoints - business.rewardPoints) /
                    business.maxRewardPoints) *
                    100,
                )
              : 0,
        },
      };
    } catch (error) {
      throw new HttpException(
        (error as Error)?.message || 'Error fetching reward points info',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getRewardPointsPurchaseHistory(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<APIPaginatedResponseDto<any[]>> {
    try {
      const business = await this.businessesModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!business) {
        throw new NotFoundException('Business not found');
      }

      const skip = (page - 1) * limit;

      const [purchaseHistory, total] = await Promise.all([
        this.purchaseHistoryModel
          .find({ businessId: business._id })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.purchaseHistoryModel.countDocuments({ businessId: business._id }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        statusCode: HttpStatus.OK,
        message: 'Reward points purchase history fetched successfully',
        data: purchaseHistory,
        total,
        currentPage: page,
        totalPages,
      };
    } catch (error) {
      throw new HttpException(
        (error as Error)?.message ||
          'Error fetching reward points purchase history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
