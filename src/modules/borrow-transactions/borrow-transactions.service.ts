import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateBorrowTransactionDto } from './dto/create-borrow-transaction.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { BorrowTransaction } from './schemas/borrow-transactions.schema';
import { Connection, Model, Types } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Users } from '../users/schemas/users.schema';
import { Customers } from '../users/schemas/customer.schema';
import { CloudinaryService } from 'src/infrastructure/cloudinary/cloudinary.service';
import * as QRCode from 'qrcode';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Wallets } from '../wallets/schemas/wallets.schema';
import {
  WalletTransactions,
  WalletTransactionsDocument,
} from '../wallet-transactions/schema/wallet-transactions.schema';
import { TransactionType } from 'src/common/constants/transaction-type.enum';
import { Product } from '../products/schemas/product.schema';
import { ProductSize } from '../product-sizes/schemas/product-size.schema';
import { Businesses } from '../businesses/schemas/businesses.schema';
import { ProductGroup } from '../product-groups/schemas/product-group.schema';
import { SystemSetting } from '../system-settings/schemas/system-setting.schema';
import { loadEntities } from './helpers/load-entities.helper';
import { processImages } from './helpers/process-image.helper';
import { applyConditionChange } from './helpers/apply-conditon-change.helper';
import { handleRefund } from './helpers/handle-refund.helpter';
import { handleForfeit } from './helpers/handle-forfeit.helper';
import { handleReuseLimit } from './helpers/handle-reuse-limit.helper';
import { applyRewardPointChange } from './helpers/apply-reward-points-change.helper';
import { Material } from '../materials/schemas/material.schema';
import { applyEcoPointChange } from './helpers/apply-eco-point-change.helper';
import { Staff } from '../staffs/schemas/staffs.schema';
import { calculateLateReturnInfo } from './utils/calculate-late-return';
import { handlePartialRefund } from './helpers/handle-partial-refund.helper';
import {
  buildConditionImageObject,
  buildCurrentDamageFaces,
} from './helpers/condition.helper';
import { calculateTotalDamagePoints } from './utils/calculateDamagePoints';
import { determineFinalCondition } from './helpers/determine-final-condition.helper';
import { uploadTempImages } from './helpers/upload-temp-image.helper';
import { CheckProductConditionDto } from './dto/check-product-condition';
import { loadEntitiesForCheck } from './helpers/load-entity-for-check.helper';
import { moveImagesToMain } from './helpers/moves-image-to-main.helper';
import { ConfirmReturnDto } from './dto/confirm-return-condition.dto';
import { calculateTotalDamagePointsWhenReturn } from './utils/calculateDamagePointsWhenReturn';
import { determineFinalConditionWhenReturn } from './helpers/determine-final-condition-when-return.helper';
import { GetTransactionsDto } from './dto/get-borrow-transactions';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BorrowTransactionsService {
  private readonly logger = new Logger(BorrowTransactionsService.name);

  constructor(
    @InjectModel(BorrowTransaction.name)
    private readonly borrowTransactionModel: Model<BorrowTransaction>,

    @InjectModel(Users.name) private readonly userModel: Model<Users>,

    @InjectModel(Customers.name)
    private readonly customerModel: Model<Customers>,

    @InjectModel(Wallets.name) private readonly walletsModel: Model<Wallets>,

    @InjectModel(WalletTransactions.name)
    private readonly walletTransactionsModel: Model<WalletTransactionsDocument>,

    @InjectModel(Material.name) private readonly materialModel: Model<Material>,

    @InjectModel(Product.name) private readonly productModel: Model<Product>,

    @InjectModel(ProductSize.name)
    private readonly productSizeModel: Model<ProductSize>,

    @InjectModel(ProductGroup.name)
    private readonly productGroupModel: Model<ProductGroup>,

    @InjectModel(Businesses.name)
    private readonly businessesModel: Model<Businesses>,

    @InjectModel(SystemSetting.name)
    private readonly systemSettingsModel: Model<SystemSetting>,
    @InjectModel(Staff.name) private readonly staffModel: Model<Staff>,

    @InjectConnection() private readonly connection: Connection,

    private readonly cloudinaryService: CloudinaryService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createBorrowTransaction(
    dto: CreateBorrowTransactionDto,
    userId: string,
  ): Promise<APIResponseDto> {
    const session = await this.borrowTransactionModel.db.startSession();
    session.startTransaction();
    try {
      const user = await this.userModel.findById(userId).session(session);
      if (!user)
        throw new HttpException('User not found', HttpStatus.BAD_REQUEST);

      const customer = await this.customerModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .session(session);
      if (!customer)
        throw new HttpException('Customer not found', HttpStatus.BAD_REQUEST);

      const product = await this.productModel
        .findById(dto.productId)
        .session(session);

      if (!product)
        throw new HttpException('Product not found', HttpStatus.BAD_REQUEST);

      const productGroup = await this.productGroupModel
        .findById(product.productGroupId)
        .session(session);

      const previousConditionImages = { ...product.lastConditionImages };

      const previousDamageFaces = product.lastDamageFaces || [];

      // Load borrow policy early to derive dynamic limits (admin configurable)
      const borrowPolicy = await this.systemSettingsModel
        .findOne({
          key: 'borrow_policy',
          category: 'borrow',
        })
        .session(session);

      if (!borrowPolicy) {
        throw new HttpException(
          'Borrow policy settings not found',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const maxConcurrent =
        Number(borrowPolicy.value?.maxConcurrentBorrows) > 0
          ? Number(borrowPolicy.value.maxConcurrentBorrows)
          : 3; // fallback
      const activeCount = await this.borrowTransactionModel
        .countDocuments({
          customerId: customer._id,
          status: { $in: ['pending_pickup', 'borrowing'] },
        })
        .session(session as any);

      if (activeCount >= maxConcurrent) {
        throw new HttpException(
          `Maximum concurrent borrow limit reached (${maxConcurrent})`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (productGroup?.businessId?.toString() !== dto.businessId?.toString())
        throw new HttpException(
          'Product does not belong to the specified business',
          HttpStatus.BAD_REQUEST,
        );

      if (product.status !== 'available')
        throw new HttpException(
          'Product is not available for borrowing',
          HttpStatus.BAD_REQUEST,
        );

      const productSize = await this.productSizeModel
        .findById(product.productSizeId)
        .session(session);

      if (dto.depositValue !== productSize?.depositValue)
        throw new HttpException(
          'Invalid deposit value',
          HttpStatus.BAD_REQUEST,
        );

      const maxDaysBorrowAllowed = borrowPolicy.value.maxDaysBorrowAllowed;

      if (dto.durationInDays > maxDaysBorrowAllowed) {
        throw new HttpException(
          `Duration exceeds maximum allowed days (${maxDaysBorrowAllowed})`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const borrowDate = new Date();
      const dueDate = new Date(borrowDate);
      dueDate.setDate(borrowDate.getDate() + dto.durationInDays);

      const { depositValue, durationInDays } = dto;
      const depositAmount =
        (Math.round(Number(depositValue) * 100) * Number(durationInDays)) / 100;

      const customerWallet = await this.walletsModel
        .findOne({ userId: user._id, type: 'customer' })
        .session(session);

      if (!customerWallet)
        throw new HttpException(
          'Customer wallet not found',
          HttpStatus.NOT_FOUND,
        );

      if (customerWallet.availableBalance < depositAmount)
        throw new HttpException(
          'Insufficient wallet balance',
          HttpStatus.BAD_REQUEST,
        );

      const business = await this.businessesModel
        .findById(dto.businessId)
        .session(session);

      if (!business)
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);

      if (customer.userId?.toString() === business.userId?.toString()) {
        throw new HttpException(
          'Cannot borrow from your own business',
          HttpStatus.BAD_REQUEST,
        );
      }

      const businessWallet = await this.walletsModel
        .findOne({ userId: business.userId, type: 'business' })
        .session(session);

      if (!businessWallet)
        throw new HttpException(
          'Business wallet not found',
          HttpStatus.NOT_FOUND,
        );

      const [transaction] = await this.borrowTransactionModel.create(
        [
          {
            productId: new Types.ObjectId(dto.productId),
            businessId: new Types.ObjectId(dto.businessId),
            borrowDate,
            dueDate,
            depositAmount,
            customerId: customer._id,
            status: 'pending_pickup',
            borrowTransactionType: 'borrow',
            previousConditionImages,
            previousDamageFaces,
          },
        ],
        { session },
      );

      const qrCodeData = await QRCode.toDataURL(transaction._id.toString());
      const uploadResult = await this.cloudinaryService.uploadQRCode(
        Buffer.from(qrCodeData.split(',')[1], 'base64'),
        transaction._id.toString(),
        'borrow-transactions/qrcodes',
      );

      transaction.qrCode = uploadResult.secure_url as string;

      customerWallet.availableBalance -= depositAmount;
      businessWallet.holdingBalance += depositAmount;

      const walletCustomer = new this.walletTransactionsModel({
        walletId: customerWallet._id,
        relatedUserId: business._id,
        relatedUserType: 'business',
        amount: depositAmount,
        transactionType: TransactionType.BORROW_DEPOSIT,
        direction: 'out',
        status: 'completed',
        description: 'Deposit for borrow transaction',
        referenceType: 'borrow',
        referenceId: transaction._id,
        balanceType: 'available',
      });

      await walletCustomer.save({ session });

      if (!businessWallet) {
        throw new HttpException(
          'Business wallet not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const walletBusiness = new this.walletTransactionsModel({
        walletId: businessWallet._id,
        relatedUserId: customer._id,
        relatedUserType: 'customer',
        amount: depositAmount,
        transactionType: TransactionType.BORROW_DEPOSIT,
        direction: 'in',
        status: 'completed',
        description: 'Deposit received for borrow transaction',
        referenceType: 'borrow',
        referenceId: transaction._id,
        balanceType: 'holding',
      });

      await walletBusiness.save({ session });

      await this.productModel.updateOne(
        { _id: product._id },
        { status: 'non-available' },
        { session },
      );

      await Promise.all([
        transaction.save({ session }),
        customerWallet.save({ session }),
        businessWallet.save({ session }),
      ]);

      await session.commitTransaction();

      return {
        statusCode: HttpStatus.CREATED,
        message: `Borrow transaction created successfully`,
        data: transaction,
      };
    } catch (error) {
      await session.abortTransaction();

      // Nếu là HttpException → ném nguyên xi ra
      if (error instanceof HttpException) {
        throw error;
      }

      // Lỗi khác → 500
      throw new HttpException(
        error.message || 'Failed to create borrow transaction',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.endSession();
    }
  }

  async confirmBorrowTransaction(
    userId: string,
    transactionId: string,
    userRole: RolesEnum[],
  ): Promise<APIResponseDto> {
    try {
      this.logger.debug('confirmBorrowTransaction called');
      const transaction =
        await this.borrowTransactionModel.findById(transactionId);
      if (!transaction)
        throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      if (transaction.status !== 'pending_pickup') {
        throw new HttpException(
          'Only transactions with status "pending_pickup" can be confirmed.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Role-based ownership validation
      if (userRole.includes(RolesEnum.BUSINESS)) {
        const business = await this.businessesModel.findOne({
          userId: new Types.ObjectId(userId),
        });
        if (!business)
          throw new HttpException('Business not found', HttpStatus.NOT_FOUND);
        if (business._id.toString() !== transaction.businessId.toString()) {
          throw new HttpException(
            'Transaction does not belong to this business',
            HttpStatus.FORBIDDEN,
          );
        }
      } else if (userRole.includes(RolesEnum.STAFF)) {
        const staff = await this.staffModel.findOne({
          userId: new Types.ObjectId(userId),
          status: 'active',
        });
        if (!staff)
          throw new HttpException(
            'Staff not found or inactive',
            HttpStatus.NOT_FOUND,
          );
        if (staff.businessId.toString() !== transaction.businessId.toString()) {
          throw new HttpException(
            'Transaction does not belong to staff business',
            HttpStatus.FORBIDDEN,
          );
        }
      } else {
        throw new HttpException(
          'Role not permitted to confirm transactions',
          HttpStatus.FORBIDDEN,
        );
      }

      transaction.status = 'borrowing';
      await transaction.save();

      return {
        statusCode: HttpStatus.OK,
        message: 'Transaction confirmed successfully.',
        data: transaction,
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to confirm transaction.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getBusinessTransactions(
    userId: string,
    role: RolesEnum[],
    options: GetTransactionsDto,
  ): Promise<APIResponseDto> {
    try {
      let business;

      // === If staff: find staff then business ===
      if (role.includes(RolesEnum.STAFF)) {
        const staff = await this.staffModel.findOne({
          userId: new Types.ObjectId(userId),
        });

        if (!staff) {
          throw new NotFoundException('Staff not found');
        }

        business = await this.businessesModel.findById(staff.businessId);
        if (!business) {
          throw new NotFoundException('Business not found for this staff');
        }

        userId = business.userId.toString();
      }

      // === If business: find business by own userId ===
      if (role.includes(RolesEnum.BUSINESS)) {
        business = await this.businessesModel.findOne({
          userId: new Types.ObjectId(userId),
        });

        if (!business) {
          throw new NotFoundException('Business not found');
        }
      }

      const businessWallet = await this.walletsModel.findOne({
        userId: new Types.ObjectId(userId),
        type: 'business',
      });

      if (!businessWallet) {
        throw new NotFoundException('Business wallet not found');
      }

      // ===== BUILD QUERY =====
      const query: any = { businessId: business._id };

      if (options.status) query.status = options.status;
      if (options.borrowTransactionType)
        query.borrowTransactionType = options.borrowTransactionType;

      // ===== DATE FILTER =====
      if (options.fromDate || options.toDate) {
        query.createdAt = {};

        if (options.fromDate) {
          query.createdAt.$gte = new Date(options.fromDate);
        }

        if (options.toDate) {
          const endOfDay = new Date(options.toDate);
          endOfDay.setHours(23, 59, 59, 999);
          query.createdAt.$lte = endOfDay;
        }
      }

      // ===== FILTER PRODUCT =====
      const productIdSet = new Set<string>();

      if (options.productName) {
        const regex = new RegExp(options.productName, 'i');

        const matchedGroupIds = await this.productGroupModel
          .find({ name: regex })
          .distinct('_id');

        const matchedProductIds = await this.productModel
          .find({ productGroupId: { $in: matchedGroupIds } })
          .distinct('_id');

        matchedProductIds.forEach((id) => productIdSet.add(id.toString()));
      }

      if (options.serialNumber) {
        const regex = new RegExp(options.serialNumber, 'i');

        const matchedBySerial = await this.productModel
          .find({ serialNumber: regex })
          .distinct('_id');

        matchedBySerial.forEach((id) => productIdSet.add(id.toString()));
      }

      if (productIdSet.size > 0) {
        query.productId = {
          $in: Array.from(productIdSet).map((s) => new Types.ObjectId(s)),
        };
      }

      // ===== PAGINATION =====
      const page = options.page && options.page > 0 ? options.page : 1;
      const limit = options.limit && options.limit > 0 ? options.limit : 10;

      const total = await this.borrowTransactionModel.countDocuments(query);

      // ===== FETCH BORROW TRANSACTIONS =====
      const transactions = await this.borrowTransactionModel
        .find(query)
        .select(
          '-previousConditionImages -currentConditionImages -previousDamageFaces -currentDamageFaces',
        )
        .populate({
          path: 'productId',
          select: 'qrCode serialNumber productGroupId productSizeId',
          populate: [
            { path: 'productGroupId', select: 'name imageUrl' },
            { path: 'productSizeId', select: 'sizeName' },
          ],
        })
        .populate({
          path: 'customerId',
          select: 'userId fullName phone',
          populate: { path: 'userId', select: 'email' },
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const borrowIds = transactions.map((t) => t._id);

      // ===== FETCH WALLET TXS OF BUSINESS WALLET =====
      const walletTxs = await this.walletTransactionsModel
        .find({
          referenceId: { $in: borrowIds },
          referenceType: 'borrow',
          status: 'completed',
          walletId: businessWallet._id,
        })
        .lean();

      // ===== MAPPING status -> transactionType =====
      const statusToWalletType: Record<string, string> = {
        borrowing: 'borrow_deposit',
        returned: 'return_refund',
        return_late: 'penalty',
        rejected: 'deposit_forfeited',
        lost: 'deposit_forfeited',
      };

      // ===== MERGE - ONLY 1 WALLET TRANSACTION =====
      const finalData = transactions.map((t) => {
        const expectedTxType = statusToWalletType[t.status] || null;

        const matchedTx =
          expectedTxType &&
          walletTxs.find(
            (w) =>
              w.referenceId?.toString() === t._id.toString() &&
              w.transactionType === expectedTxType,
          );

        return {
          ...t,
          walletTransaction: matchedTx || null,
        };
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Business transactions fetched successfully.',
        data: {
          items: finalData,
          total,
          page,
          limit,
        },
      };
    } catch (error) {
      throw new HttpException(
        error?.message || 'Failed to fetch business transactions.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getBusinessHistory(
    userId: string,
    options: {
      status?: string;
      productName?: string;
      serialNumber?: string;
      borrowTransactionType?: string;
    },
  ): Promise<APIResponseDto> {
    try {
      const business = await this.businessesModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!business) {
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);
      }

      const query: any = { businessId: business._id };
      if (options.status) query.status = options.status;
      if (options.borrowTransactionType)
        query.borrowTransactionType = options.borrowTransactionType;

      const productIdSet = new Set<string>();

      if (options.productName) {
        const regex = new RegExp(options.productName, 'i');
        const matchedGroupIds = await this.productGroupModel
          .find({ name: regex })
          .distinct('_id');

        const matchedProductIds = await this.productModel
          .find({ productGroupId: { $in: matchedGroupIds } })
          .distinct('_id');

        matchedProductIds.forEach((id) => productIdSet.add(id.toString()));
      }

      if (options.serialNumber) {
        const regex = new RegExp(options.serialNumber, 'i');
        const matchedBySerial = await this.productModel
          .find({ serialNumber: regex })
          .distinct('_id');
        matchedBySerial.forEach((id) => productIdSet.add(id.toString()));
      }

      if (productIdSet.size > 0) {
        query.productId = {
          $in: Array.from(productIdSet).map((s) => new Types.ObjectId(s)),
        };
      }

      const transactions = await this.borrowTransactionModel
        .find(query)
        .populate({
          path: 'productId',
          select:
            'qrCode serialNumber status condition reuseCount productGroupId productSizeId',
          populate: [
            { path: 'productGroupId', select: 'name imageUrl' },
            { path: 'productSizeId', select: 'sizeName' },
          ],
        })
        .populate({ path: 'customerId', select: 'userId fullName phone' })
        .sort({ createdAt: -1 })
        .lean();

      return {
        statusCode: HttpStatus.OK,
        message: 'Business transaction history fetched successfully.',
        data: transactions,
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message ||
          'Failed to fetch business transaction history.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getBusinessTransactionDetail(
    userId: string,
    role: RolesEnum[],
    transactionId: string,
  ): Promise<APIResponseDto> {
    try {
      let business;

      if (role.includes(RolesEnum.STAFF)) {
        const staff = await this.staffModel.findOne({
          userId: new Types.ObjectId(userId),
        });

        if (!staff) throw new NotFoundException('Staff not found');

        business = await this.businessesModel.findById(staff.businessId);
        if (!business)
          throw new NotFoundException('Business not found for this staff');

        userId = business.userId.toString();
      }

      // ==== BUSINESS OWNER ====
      if (role.includes(RolesEnum.BUSINESS)) {
        business = await this.businessesModel.findOne({
          userId: new Types.ObjectId(userId),
        });

        if (!business) {
          throw new NotFoundException('Business not found');
        }
      }

      // ==== GET BUSINESS WALLET ====
      const businessWallet = await this.walletsModel.findOne({
        userId: new Types.ObjectId(userId),
        type: 'business',
      });

      if (!businessWallet) {
        throw new NotFoundException('Business wallet not found');
      }

      // ==== GET BORROW TRANSACTION DETAIL ====
      const transaction = await this.borrowTransactionModel
        .findOne({
          _id: new Types.ObjectId(transactionId),
          businessId: business._id, // Ensure this tx belongs to this business
        })
        .populate({
          path: 'productId',
          select: 'qrCode serialNumber productGroupId productSizeId',
          populate: [
            {
              path: 'productGroupId',
              select: 'name imageUrl materialId',
              populate: { path: 'materialId', select: 'materialName' },
            },
            { path: 'productSizeId', select: 'sizeName' },
          ],
        })
        .populate({
          path: 'customerId',
          select: 'userId fullName phone',
        })
        .lean();

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      // ==== GET ALL WALLET TRANSACTIONS OF THIS BUSINESS WALLET ====
      const walletTransactions = await this.walletTransactionsModel
        .find({
          referenceId: new Types.ObjectId(transactionId),
          referenceType: 'borrow',
          walletId: businessWallet._id,
        })
        .sort({ createdAt: 1 })
        .lean();

      return {
        statusCode: HttpStatus.OK,
        message: 'Business transaction detail fetched successfully.',
        data: {
          ...transaction,
          walletTransactions,
        },
      };
    } catch (error) {
      throw new HttpException(
        error?.message || 'Failed to fetch transaction detail.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getBusinessPendingTransactions(
    userId: string,
    role: RolesEnum[],
  ): Promise<APIResponseDto> {
    try {
      let business;

      // ===== STAFF → map sang business.owner =====
      if (role.includes(RolesEnum.STAFF)) {
        const staff = await this.staffModel.findOne({
          userId: new Types.ObjectId(userId),
          status: 'active',
        });

        if (!staff) {
          throw new NotFoundException('Staff not found');
        }

        business = await this.businessesModel.findById(staff.businessId);
        if (!business) {
          throw new NotFoundException('Business not found for this staff');
        }

        // ⚡ CHUYỂN userId về userId của business owner
        userId = business.userId.toString();
      }

      // ===== BUSINESS OWNER =====
      if (role.includes(RolesEnum.BUSINESS)) {
        business = await this.businessesModel.findOne({
          userId: new Types.ObjectId(userId),
        });

        if (!business) {
          throw new NotFoundException('Business not found');
        }
      }

      // ===== FETCH PENDING TRANSACTIONS =====
      const transactions = await this.borrowTransactionModel
        .find({
          businessId: business._id,
          borrowTransactionType: 'borrow',
          status: 'pending_pickup',
        })
        .populate([
          {
            path: 'customerId',
            select: 'userId fullName phone',
            populate: { path: 'userId', select: 'email' },
          },
          {
            path: 'productId',
            select:
              'qrCode serialNumber status reuseCount productGroupId productSizeId',
            populate: [
              {
                path: 'productGroupId',
                select: 'name imageUrl materialId',
                populate: { path: 'materialId', select: 'materialName' },
              },
              { path: 'productSizeId', select: 'sizeName' },
            ],
          },
        ])
        .select('-businessId')
        .sort({ createdAt: -1 })
        .lean();

      return {
        statusCode: HttpStatus.OK,
        message: 'Pending transactions fetched successfully.',
        data: transactions,
      };
    } catch (error) {
      throw new HttpException(
        error?.message || 'Failed to fetch pending transactions.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCustomerTransactionHistory(
    userId: string,
    options: GetTransactionsDto,
  ): Promise<APIResponseDto> {
    try {
      // ===== GET CUSTOMER =====
      const customer = await this.customerModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!customer) {
        throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      }

      // ===== GET CUSTOMER WALLET =====
      const customerWallet = await this.walletsModel.findOne({
        userId: new Types.ObjectId(userId),
        type: 'customer',
      });

      if (!customerWallet) {
        throw new NotFoundException('Customer wallet not found');
      }

      // ===== BUILD QUERY =====
      const query: any = { customerId: customer._id };

      if (options.status) query.status = options.status;
      if (options.borrowTransactionType)
        query.borrowTransactionType = options.borrowTransactionType;
      // ===== DATE FILTER =====
      if (options.fromDate || options.toDate) {
        query.createdAt = {};

        if (options.fromDate) {
          query.createdAt.$gte = new Date(options.fromDate);
        }

        if (options.toDate) {
          const endOfDay = new Date(options.toDate);
          endOfDay.setHours(23, 59, 59, 999);
          query.createdAt.$lte = endOfDay;
        }
      }

      // ===== FILTER PRODUCT =====
      const productIdSet = new Set<string>();

      if (options.productName) {
        const regex = new RegExp(options.productName, 'i');

        const matchedGroupIds = await this.productGroupModel
          .find({ name: regex })
          .distinct('_id');

        const matchedProductIds = await this.productModel
          .find({ productGroupId: { $in: matchedGroupIds } })
          .distinct('_id');

        matchedProductIds.forEach((id) => productIdSet.add(id.toString()));
      }

      if (options.serialNumber) {
        const regex = new RegExp(options.serialNumber, 'i');

        const matchedBySerial = await this.productModel
          .find({ serialNumber: regex })
          .distinct('_id');

        matchedBySerial.forEach((id) => productIdSet.add(id.toString()));
      }

      if (productIdSet.size > 0) {
        query.productId = {
          $in: Array.from(productIdSet).map((s) => new Types.ObjectId(s)),
        };
      }

      // ===== PAGINATION =====
      const page = options.page && options.page > 0 ? options.page : 1;
      const limit = options.limit && options.limit > 0 ? options.limit : 10;

      const total = await this.borrowTransactionModel.countDocuments(query);

      // ===== FETCH TRANSACTIONS =====
      const transactions = await this.borrowTransactionModel
        .find(query)
        .select(
          '-previousConditionImages -currentConditionImages -previousDamageFaces -currentDamageFaces',
        )
        .populate({
          path: 'productId',
          select: 'qrCode serialNumber productGroupId productSizeId',
          populate: [
            {
              path: 'productGroupId',
              select: 'name imageUrl materialId',
              populate: { path: 'materialId', select: 'materialName' },
            },
            { path: 'productSizeId', select: 'sizeName' },
          ],
        })
        .populate({
          path: 'businessId',
          select:
            'businessName businessPhone businessAddress businessType businessLogoUrl',
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      // ===== GET WALLET TXS (CUSTOMER WALLET) =====
      const borrowIds = transactions.map((t) => t._id);

      const walletTxs = await this.walletTransactionsModel
        .find({
          referenceId: { $in: borrowIds },
          referenceType: 'borrow',
          status: 'completed',
          walletId: customerWallet._id,
        })
        .lean();

      // ===== MAPPING status -> transactionType =====
      const statusToWalletType: Record<string, string> = {
        borrowing: 'borrow_deposit',
        returned: 'return_refund',
        return_late: 'penalty',
        // rejected: 'deposit_forfeited',
        // lost: 'deposit_forfeited',
      };

      // ===== MERGE ONLY 1 walletTransaction LIKE BUSINESS API =====
      const finalData = transactions.map((t) => {
        const expectedTx = statusToWalletType[t.status] || null;

        const matchedTx =
          expectedTx &&
          walletTxs.find(
            (w) =>
              w.referenceId?.toString() === t._id.toString() &&
              w.transactionType === expectedTx,
          );

        return {
          ...t,
          walletTransaction: matchedTx || null,
        };
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Customer transaction history fetched successfully.',
        data: {
          items: finalData,
          total,
          page,
          limit,
        },
      };
    } catch (error) {
      throw new HttpException(
        error?.message || 'Failed to fetch customer transactions.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCustomerTransactionDetail(
    userId: string,
    transactionId: string,
  ): Promise<APIResponseDto> {
    try {
      // ===== GET CUSTOMER =====
      const customer = await this.customerModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!customer) {
        throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      }

      // ===== GET CUSTOMER WALLET =====
      const customerWallet = await this.walletsModel.findOne({
        userId: new Types.ObjectId(userId),
        type: 'customer',
      });

      if (!customerWallet) {
        throw new NotFoundException('Customer wallet not found');
      }

      // ===== GET TRANSACTION =====
      const transaction = await this.borrowTransactionModel
        .findOne({
          _id: new Types.ObjectId(transactionId),
          customerId: customer._id,
        })
        .populate({
          path: 'productId',
          select:
            'qrCode serialNumber status reuseCount productGroupId productSizeId',
          populate: [
            {
              path: 'productGroupId',
              select: 'name imageUrl materialId',
              populate: { path: 'materialId', select: 'materialName' },
            },
            { path: 'productSizeId', select: 'sizeName' },
          ],
        })
        .populate({
          path: 'businessId',
          select:
            'businessName businessPhone businessAddress businessType businessLogoUrl',
        })
        .populate({
          path: 'customerId',
          select: 'userId fullName phone',
        })
        .lean();

      if (!transaction) {
        throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      }

      // ===== GET ALL WALLET TRANSACTIONS (CUSTOMER WALLET) =====
      const walletTransactions = await this.walletTransactionsModel
        .find({
          referenceId: new Types.ObjectId(transactionId),
          referenceType: 'borrow',
          walletId: customerWallet._id,
        })
        .sort({ createdAt: 1 }) // order by timeline
        .lean();

      return {
        statusCode: HttpStatus.OK,
        message: 'Customer transaction detail fetched successfully.',
        data: {
          ...transaction,
          walletTransactions,
        },
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message ||
          'Failed to fetch customer transaction detail.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async cancelCustomerPendingTransaction(
    userId: string,
    transactionId: string,
  ): Promise<APIResponseDto> {
    const session = await this.borrowTransactionModel.db.startSession();
    session.startTransaction();
    try {
      const customer = await this.customerModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .session(session);

      if (!customer) {
        throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      }

      const transaction = await this.borrowTransactionModel
        .findOne({
          _id: new Types.ObjectId(transactionId),
          customerId: customer._id,
          status: 'pending_pickup',
        })
        .session(session);

      if (!transaction) {
        throw new HttpException(
          'Pending transaction not found or not cancellable',
          HttpStatus.BAD_REQUEST,
        );
      }

      const wallet = await this.walletsModel
        .findOne({ userId: customer.userId, type: 'customer' })
        .session(session);

      if (!wallet) {
        throw new HttpException('Wallet not found', HttpStatus.NOT_FOUND);
      }

      const amount = transaction.depositAmount || 0;
      wallet.holdingBalance = Math.max(0, wallet.holdingBalance - amount);
      wallet.availableBalance += amount;
      await wallet.save({ session });

      const walletTx = new this.walletTransactionsModel({
        walletId: wallet._id,
        relatedUserId: customer.userId,
        relatedUserType: 'customer',
        amount,
        transactionType: TransactionType.RETURN_REFUND,
        direction: 'in',
        status: 'completed',
        description: 'Refund deposit due to customer cancellation',
        referenceType: 'borrow',
        referenceId: transaction._id,
        fromBalanceType: 'available',
      });

      await walletTx.save({ session });

      if (transaction.productId) {
        await this.productModel.updateOne(
          { _id: transaction.productId },
          { status: 'available' },
          { session },
        );
      }

      transaction.status = 'cancelled';
      await transaction.save({ session });

      await session.commitTransaction();

      return {
        statusCode: HttpStatus.OK,
        message: 'Transaction cancelled successfully.',
        data: transaction,
      };
    } catch (error) {
      await session.abortTransaction();
      throw new HttpException(
        (error as Error).message || 'Failed to cancel transaction.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.endSession();
    }
  }

  /**
   * Gia hạn thêm ngày mượn với các validation chống spam:
   * - Chỉ cho phép gia hạn transaction đang trong trạng thái 'borrowing'
   * - Giới hạn số lần gia hạn tối đa
   * - Giới hạn tổng thời gian mượn tối đa
   * - Phải gia hạn trước khi hết hạn (không cho gia hạn sau khi quá hạn)
   * - Cooldown giữa các lần gia hạn để tránh spam
   */
  async extendBorrowDuration(
    userId: string,
    transactionId: string,
    additionalDays: number,
  ): Promise<APIResponseDto> {
    const session = await this.borrowTransactionModel.db.startSession();
    session.startTransaction();

    try {
      const customer = await this.customerModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .session(session);

      if (!customer) {
        throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      }

      const transaction = await this.borrowTransactionModel
        .findOne({
          _id: new Types.ObjectId(transactionId),
          customerId: customer._id,
        })
        .session(session);

      if (!transaction) {
        throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      }

      if (transaction.status !== 'borrowing') {
        throw new HttpException(
          'Can only extend transactions with status "borrowing"',
          HttpStatus.BAD_REQUEST,
        );
      }

      const now = new Date();
      if (transaction.dueDate < now) {
        throw new HttpException(
          'Cannot extend overdue transaction. Please return the product first.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const lastExtensionDate = transaction.lastExtensionDate;

      if (lastExtensionDate) {
        const hoursSinceLastExtension =
          (now.getTime() - lastExtensionDate.getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastExtension < 24) {
          const hoursLeft = Math.ceil(24 - hoursSinceLastExtension);
          throw new HttpException(
            `You can only extend once every 24 hours. Please wait ${hoursLeft} more hour(s).`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const extensionCount = transaction.extensionCount || 0;

      const borrowPolicy = await this.systemSettingsModel
        .findOne({
          key: 'borrow_policy',
          category: 'borrow',
        })
        .session(session);

      if (!borrowPolicy) {
        throw new HttpException(
          'Borrow policy settings not found',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const maxExtensions =
        Number(borrowPolicy.value?.maxExtensions) > 0
          ? Number(borrowPolicy.value.maxExtensions)
          : 3; // fallback

      if (extensionCount >= maxExtensions) {
        throw new HttpException(
          `Maximum extension limit reached (${maxExtensions} times). Please return the product.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const maxDaysBorrowAllowed = borrowPolicy.value.maxDaysBorrowAllowed;
      const currentDuration = Math.ceil(
        (transaction.dueDate.getTime() - transaction.borrowDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const totalDurationAfterExtension = currentDuration + additionalDays;

      if (totalDurationAfterExtension > maxDaysBorrowAllowed) {
        const remainingDays = maxDaysBorrowAllowed - currentDuration;
        throw new HttpException(
          `Cannot extend. Maximum total duration is ${maxDaysBorrowAllowed} days. You can only extend ${remainingDays} more day(s).`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const product = await this.productModel
        .findById(transaction.productId)
        .session(session);

      if (!product) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }

      const productSize = await this.productSizeModel
        .findById(product.productSizeId)
        .session(session);

      if (!productSize) {
        throw new HttpException('Product size not found', HttpStatus.NOT_FOUND);
      }

      const additionalDeposit =
        (Math.round(Number(productSize.depositValue) * 100) *
          Number(additionalDays)) /
        100;

      const customerWallet = await this.walletsModel
        .findOne({ userId: customer.userId, type: 'customer' })
        .session(session);

      if (!customerWallet) {
        throw new HttpException(
          'Customer wallet not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (customerWallet.availableBalance < additionalDeposit) {
        throw new HttpException(
          `Insufficient wallet balance. Need ${additionalDeposit} VND for ${additionalDays} day(s) extension.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const business = await this.businessesModel
        .findById(transaction.businessId)
        .session(session);

      if (!business) {
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);
      }

      const businessWallet = await this.walletsModel
        .findOne({ userId: business.userId, type: 'business' })
        .session(session);

      if (!businessWallet) {
        throw new HttpException(
          'Business wallet not found',
          HttpStatus.NOT_FOUND,
        );
      }

      customerWallet.availableBalance -= additionalDeposit;
      businessWallet.holdingBalance += additionalDeposit;

      const customerWalletTx = new this.walletTransactionsModel({
        walletId: customerWallet._id,
        relatedUserId: business._id,
        relatedUserType: 'business',
        amount: additionalDeposit,
        transactionType: TransactionType.BORROW_DEPOSIT,
        direction: 'out',
        status: 'completed',
        description: `Extension deposit for ${additionalDays} day(s)`,
        referenceType: 'borrow',
        referenceId: transaction._id,
        balanceType: 'available',
      });

      const businessWalletTx = new this.walletTransactionsModel({
        walletId: businessWallet._id,
        relatedUserId: customer._id,
        relatedUserType: 'customer',
        amount: additionalDeposit,
        transactionType: TransactionType.BORROW_DEPOSIT,
        direction: 'in',
        status: 'completed',
        description: `Extension deposit received for ${additionalDays} day(s)`,
        referenceType: 'borrow',
        referenceId: transaction._id,
        balanceType: 'holding',
      });

      const newDueDate = new Date(transaction.dueDate);
      newDueDate.setDate(newDueDate.getDate() + additionalDays);

      transaction.dueDate = newDueDate;
      transaction.depositAmount += additionalDeposit;
      transaction.extensionCount = extensionCount + 1;
      transaction.lastExtensionDate = now;

      await Promise.all([
        transaction.save({ session }),
        customerWallet.save({ session }),
        businessWallet.save({ session }),
        customerWalletTx.save({ session }),
        businessWalletTx.save({ session }),
      ]);

      await session.commitTransaction();

      return {
        statusCode: HttpStatus.OK,
        message: `Transaction extended successfully by ${additionalDays} day(s)`,
        data: {
          transaction,
          additionalDeposit,
          newDueDate,
          extensionCount: extensionCount + 1,
          remainingExtensions: maxExtensions - extensionCount - 1,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      throw new HttpException(
        (error as Error).message || 'Failed to extend transaction.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.endSession();
    }
  }

  // Check before return
  async checkReturnCondition(
    serialNumber: string,
    dto: CheckProductConditionDto,
    images: {
      frontImage?: Express.Multer.File[];
      backImage?: Express.Multer.File[];
      leftImage?: Express.Multer.File[];
      rightImage?: Express.Multer.File[];
      topImage?: Express.Multer.File[];
      bottomImage?: Express.Multer.File[];
    },
  ) {
    const { product, productSize, material, damagePolicy, borrowPolicy } =
      await loadEntitiesForCheck(serialNumber, {
        productModel: this.productModel,
        productGroupModel: this.productGroupModel,
        productSizeModel: this.productSizeModel,
        materialModel: this.materialModel,
        borrowTransactionModel: this.borrowTransactionModel,
        systemSettingsModel: this.systemSettingsModel,
      });

    // 1. Upload temp images
    const tempUploadedUrls = await uploadTempImages(
      images,
      this.cloudinaryService,
    );

    // 2. Build damage faces
    const previewDamageFaces = buildCurrentDamageFaces(dto);

    // 4. Tính điểm damage
    const totalPoints = calculateTotalDamagePoints(dto, damagePolicy);

    // 5. Tính condition
    const previewCondition = determineFinalCondition(
      dto,
      damagePolicy,
      totalPoints,
    );

    return {
      success: HttpStatus.OK,
      message: 'Preview product condition',
      preview: {
        serialNumber,
        damageFaces: previewDamageFaces,
        tempImages: tempUploadedUrls,
        totalDamagePoints: totalPoints,
        finalCondition: previewCondition,
      },
    };
  }

  // Get damage issues
  async getDamageIssues() {
    const settings = await this.systemSettingsModel.findOne({
      key: 'damage_issues',
      category: 'return_check',
    });

    if (!settings || !settings.value) {
      throw new BadRequestException('Damage issues are not configured.');
    }

    // Convert Object -> Array
    const issues = Object.entries(settings.value).map(([issue, points]) => ({
      issue,
      points,
    }));

    return {
      statusCode: HttpStatus.OK,
      message: 'Get damage policy success',
      data: issues,
    };
  }

  // Business confirm when return
  async confirmReturnCondition(
    serialNumber: string,
    userId: string,
    role: RolesEnum[],
    dto: ConfirmReturnDto,
  ) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const {
        business,
        customer,
        product,
        productGroup,
        productSize,
        material,
        borrowTransaction,
        customerWallet,
        businessWallet,
        rewardPolicy,
        borrowPolicy,
        damagePolicy,
      } = await loadEntities(serialNumber, userId, role, session, {
        businessesModel: this.businessesModel,
        productModel: this.productModel,
        productGroupModel: this.productGroupModel,
        productSizeModel: this.productSizeModel,
        materialModel: this.materialModel,
        borrowTransactionModel: this.borrowTransactionModel,
        customerModel: this.customerModel,
        walletsModel: this.walletsModel,
        systemSettingsModel: this.systemSettingsModel,
        staffModel: this.staffModel,
      });

      const conditionImages = dto.tempImages;

      // 2. Lấy damageFaces từ preview (đã tính check API)
      const damageFaces = dto.damageFaces;

      // Assign
      borrowTransaction.currentDamageFaces = damageFaces;
      borrowTransaction.currentConditionImages = conditionImages;

      product.lastDamageFaces = damageFaces;
      product.lastConditionImages = conditionImages;

      // 3. Tính lại điểm để đảm bảo integrity
      const totalPoints =
        calculateTotalDamagePointsWhenReturn(damageFaces, damagePolicy) ??
        dto.totalDamagePoints;

      const finalCondition =
        determineFinalConditionWhenReturn(
          damageFaces,
          damagePolicy,
          totalPoints,
        ) ?? dto.finalCondition;

      borrowTransaction.totalConditionPoints = totalPoints;

      // 4. Tính late
      const lateInfo = calculateLateReturnInfo(borrowTransaction, borrowPolicy);

      // 5. Apply condition
      applyConditionChange(
        product,
        borrowTransaction,
        { note: dto.note, condition: finalCondition },
        lateInfo.isLate,
      );

      // 6. Reuse limit
      handleReuseLimit(product, material);

      // 7. Reward & eco points
      const { addedRewardPoints, addedRankingPoints } = applyRewardPointChange(
        customer,
        borrowTransaction.status,
        rewardPolicy,
      );

      const { addedEcoPoints, addedCo2 } = applyEcoPointChange(
        customer,
        business,
        productSize,
        material,
        borrowTransaction.status,
      );

      borrowTransaction.rewardPointChanged = addedRewardPoints;
      borrowTransaction.rankingPointChanged = addedRankingPoints;
      borrowTransaction.ecoPointChanged = addedEcoPoints;
      borrowTransaction.co2Changed = addedCo2;

      // 8. Save
      await Promise.all([
        product.save({ session }),
        borrowTransaction.save({ session }),
        customer.save({ session }),
        business.save({ session }),
      ]);

      // 9. Refund logic
      if (borrowTransaction.status === 'returned') {
        await handleRefund(
          borrowTransaction,
          businessWallet,
          customerWallet,
          session,
          this.walletTransactionsModel,
        );
      } else if (borrowTransaction.status === 'return_late') {
        await handlePartialRefund(
          borrowTransaction,
          businessWallet,
          customerWallet,
          session,
          this.walletTransactionsModel,
          lateInfo.lateFee,
        );
      } else if (borrowTransaction.status === 'rejected') {
        await handleForfeit(
          borrowTransaction,
          businessWallet,
          session,
          this.walletTransactionsModel,
        );
      }

      await session.commitTransaction();

      return {
        success: true,
        message: 'Return condition confirmed',
        data: {
          product,
          borrowTransaction,
        },
      };
    } catch (e) {
      await session.abortTransaction();
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      session.endSession();
    }
  }

  @Cron(CronExpression.EVERY_MINUTE, { timeZone: 'Asia/Ho_Chi_Minh' })
  async cancelExpiredBorrowTransactions() {
    const now = new Date();
    const borrowPolicy = await this.systemSettingsModel.findOne({
      key: 'borrow_policy',
      category: 'borrow',
    });
    const autoCancelHours = (() => {
      const raw = borrowPolicy?.value?.autoCancelHours;
      const num = typeof raw === 'number' ? raw : Number(raw);
      return num > 0 ? num : 24; // fallback
    })();
    const cutoff = new Date(now.getTime() - autoCancelHours * 60 * 60 * 1000);

    const expiredTransactions = await this.borrowTransactionModel.find({
      status: 'pending_pickup',
      borrowDate: { $lte: cutoff },
    });

    for (const transaction of expiredTransactions) {
      try {
        const customer = await this.customerModel.findById(
          transaction.customerId,
        );
        if (!customer) {
          throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
        } else {
          const userId = customer.userId;
          const wallet = await this.walletsModel.findOne({
            userId,
            type: 'customer',
          });
          if (!wallet) {
            throw new HttpException('Wallet not found', HttpStatus.NOT_FOUND);
          } else {
            const amount = transaction.depositAmount || 0;
            wallet.holdingBalance = Math.max(0, wallet.holdingBalance - amount);
            wallet.availableBalance += amount;
            await wallet.save();

            await this.walletTransactionsModel.create({
              walletId: wallet._id,
              relatedUserId: userId,
              relatedUserType: 'customer',
              amount,
              transactionType: TransactionType.RETURN_REFUND,
              direction: 'in',
              status: 'completed',
              description:
                'Refund deposit due to uncollected borrow (auto-cancel)',
              referenceType: 'borrow',
              referenceId: transaction._id,
              fromBalanceType: 'available',
            });
          }
        }

        transaction.status = 'cancelled';
        await transaction.save();
      } catch (error) {
        throw new HttpException(
          (error as Error).message || 'Error cancelling expired transaction',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async notifyUpcomingDueDates() {
    try {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0); // Start of today

      // Get all borrowing transactions
      const allTransactions = await this.borrowTransactionModel.find({
        status: 'borrowing',
      });

      this.logger.log(
        `Checking ${allTransactions.length} borrowing transactions for countdown notifications`,
      );

      for (const transaction of allTransactions) {
        try {
          const dueDate = new Date(transaction.dueDate);
          dueDate.setHours(0, 0, 0, 0);

          // Calculate days until due date
          const daysUntilDue = Math.floor(
            (dueDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24),
          );

          // Only send notification for the 3 days before due date + due date itself (3, 2, 1, 0 days)
          if (daysUntilDue < 0 || daysUntilDue > 3) {
            continue; // Skip if not in the countdown window
          }

          const customer = await this.customerModel.findById(
            transaction.customerId,
          );

          if (!customer) {
            this.logger.warn(
              `Customer not found for transaction ${transaction._id.toString()}`,
            );
            continue;
          }

          // Check if notification was already sent today
          const lastNotificationDate = transaction.dueNotificationSentAt
            ? new Date(transaction.dueNotificationSentAt)
            : null;
          const lastNotificationDateStart = lastNotificationDate
            ? new Date(lastNotificationDate)
            : null;
          if (lastNotificationDateStart) {
            lastNotificationDateStart.setHours(0, 0, 0, 0);
          }

          // If notification was sent today, skip
          if (
            lastNotificationDateStart &&
            lastNotificationDateStart.getTime() === todayStart.getTime()
          ) {
            this.logger.debug(
              `Countdown notification already sent today for transaction ${transaction._id.toString()}`,
            );
            continue;
          }

          const product = await this.productModel.findById(
            transaction.productId,
          );
          const productName = product?.productGroupId
            ? (await this.productGroupModel.findById(product.productGroupId))
                ?.name || 'Unknown Product'
            : 'Unknown Product';

          const notificationTitle =
            daysUntilDue === 0
              ? 'Return Due Today'
              : `${daysUntilDue} day(s) until return due`;

          const notificationMessage =
            daysUntilDue === 0
              ? `Your borrowed item "${productName}" must be returned TODAY! Please return it immediately to avoid late fees.`
              : `Your borrowed item "${productName}" must be returned in ${daysUntilDue} day(s) (due on ${dueDate.toLocaleDateString()}). Please ensure timely return to avoid late fees.`;

          // Create notification in DB
          await this.notificationsService.create({
            receiverId: customer.userId,
            receiverType: 'customer',
            title: notificationTitle,
            message: notificationMessage,
            type: 'borrow',
            referenceType: 'borrow',
            referenceId: transaction._id,
          });

          // Mark notification as sent with today's date
          transaction.dueNotificationSent = true;
          transaction.dueNotificationSentAt = now;
          await transaction.save();

          this.logger.log(
            `Countdown notification sent for customer ${customer._id.toString()} - Transaction ${transaction._id.toString()} (${daysUntilDue} days remaining)`,
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `Error processing countdown notification for transaction ${transaction._id.toString()}: ${errorMessage}`,
          );
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error in notifyUpcomingDueDates: ${errorMessage}`);
      // Silently fail - cron jobs should not throw
    }
  }
}
