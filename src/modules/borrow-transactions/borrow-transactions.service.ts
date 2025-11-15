import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateBorrowTransactionDto } from './dto/create-borrow-transaction.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { BorrowTransaction } from './schemas/borrow-transactions.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
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

@Injectable()
export class BorrowTransactionsService {
  constructor(
    @InjectModel(BorrowTransaction.name)
    private readonly borrowTransactionModel: Model<BorrowTransaction>,
    @InjectModel(Users.name) private readonly userModel: Model<Users>,
    @InjectModel(Customers.name)
    private readonly customerModel: Model<Customers>,
    @InjectModel(Wallets.name) private readonly walletsModel: Model<Wallets>,
    @InjectModel(WalletTransactions.name)
    private readonly walletTransactionsModel: Model<WalletTransactionsDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    private readonly cloudinaryService: CloudinaryService,
    @InjectModel(ProductSize.name)
    private readonly productSizeModel: Model<ProductSize>,
    @InjectModel(ProductGroup.name)
    private readonly productGroupModel: Model<ProductGroup>,
    @InjectModel(Businesses.name)
    private readonly businessesModel: Model<Businesses>,
    private readonly configService: ConfigService,
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

      // Enforce max concurrent borrows per customer
      const maxConcurrent =
        this.configService.get<number>(
          'borrowTransactions.maxConcurrentBorrows',
        ) || 3;
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

      if (!product)
        throw new HttpException('Product not found', HttpStatus.BAD_REQUEST);

      if (product.businessId?.toString() !== dto.businessId?.toString())
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

      const borrowDate = new Date();
      const dueDate = new Date(borrowDate);
      dueDate.setDate(borrowDate.getDate() + dto.durationInDays);

      const { depositValue, durationInDays, type } = dto;
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

      const businessWallet = await this.walletsModel
        .findOne({ userId: business.userId, type: 'business' })
        .session(session);

      const status = type === 'online' ? 'pending_pickup' : 'borrowing';

      const [transaction] = await this.borrowTransactionModel.create(
        [
          {
            productId: new Types.ObjectId(dto.productId),
            businessId: new Types.ObjectId(dto.businessId),
            borrowDate,
            dueDate,
            depositAmount,
            customerId: customer._id,
            status,
            borrowTransactionType: 'borrow',
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
      customerWallet.holdingBalance += depositAmount;

      const walletCustomer = new this.walletTransactionsModel({
        walletId: customerWallet._id,
        relatedUserId: user._id,
        relatedUserType: 'customer',
        amount: depositAmount,
        transactionType: TransactionType.BORROW_DEPOSIT,
        direction: 'out',
        status: 'completed',
        description: 'Deposit for borrow transaction',
        referenceType: 'borrow',
        referenceId: transaction._id,
        fromBalanceType: 'available',
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
        relatedUserId: user._id,
        relatedUserType: 'customer',
        amount: depositAmount,
        transactionType: TransactionType.BORROW_DEPOSIT,
        direction: 'in',
        status: 'completed',
        description: 'Deposit received for borrow transaction',
        referenceType: 'borrow',
        referenceId: transaction._id,
        fromBalanceType: 'available',
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
      ]);

      await session.commitTransaction();

      return {
        statusCode: HttpStatus.CREATED,
        message: `Borrow transaction created successfully`,
        data: transaction,
      };
    } catch (error) {
      await session.abortTransaction();
      throw new HttpException(
        (error as Error).message || 'Failed to create borrow transaction',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.endSession();
    }
  }

  async confirmBorrowTransaction(
    transactionId: string,
  ): Promise<APIResponseDto> {
    try {
      const transaction =
        await this.borrowTransactionModel.findById(transactionId);

      if (!transaction) {
        throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      }

      if (transaction.status !== 'pending_pickup') {
        throw new HttpException(
          'Only transactions with status "pending_pickup" can be confirmed.',
          HttpStatus.BAD_REQUEST,
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
    options: {
      page?: number;
      limit?: number;
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

      // product search (by productGroup name or serialNumber)
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

      const page = options.page && options.page > 0 ? options.page : 1;
      const limit = options.limit && options.limit > 0 ? options.limit : 10;

      const total = await this.borrowTransactionModel.countDocuments(query);

      const transactions = await this.borrowTransactionModel
        .find(query)
        .populate({
          path: 'productId',
          select:
            'qrCode serialNumber status reuseCount productGroupId productSizeId',
          populate: [
            { path: 'productGroupId', select: 'name imageUrl' },
            { path: 'productSizeId', select: 'sizeName' },
          ],
        })
        .populate({ path: 'customerId', select: 'userId fullName phone' })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      return {
        statusCode: HttpStatus.OK,
        message: 'Business transactions fetched successfully.',
        data: {
          items: transactions,
          total,
          page,
          limit,
        },
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to fetch business transactions.',
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
            'qrCode serialNumber status reuseCount productGroupId productSizeId',
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
    transactionId: string,
  ): Promise<APIResponseDto> {
    try {
      const business = await this.businessesModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!business) {
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);
      }

      const transaction = await this.borrowTransactionModel
        .findOne({
          _id: new Types.ObjectId(transactionId),
          businessId: business._id,
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
          path: 'customerId',
          select: 'userId fullName phone',
        })
        .lean();

      if (!transaction) {
        throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Business transaction detail fetched successfully.',
        data: transaction,
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to fetch transaction detail.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getBusinessPendingTransactions(
    businessId: string,
  ): Promise<APIResponseDto> {
    try {
      const transactions = await this.borrowTransactionModel
        .find({
          businessId: new Types.ObjectId(businessId),
          status: 'pending_pickup',
        })
        .populate({
          path: 'productId',
          populate: [{ path: 'productGroupId' }, { path: 'productSizeId' }],
        })
        .populate('customerId')
        .sort({ createdAt: -1 });

      return {
        statusCode: HttpStatus.OK,
        message: 'Pending transactions for business fetched successfully.',
        data: transactions,
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message ||
          'Failed to fetch pending transactions for business.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCustomerTransactionHistory(
    userId: string,
    filters?: {
      status?: string;
      productName?: string;
      borrowTransactionType?: string;
    },
  ): Promise<APIResponseDto> {
    try {
      const customer = await this.customerModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .lean();

      if (!customer) {
        throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      }

      const query: any = {
        customerId: customer._id,
      };

      if (filters?.status) query.status = filters.status;
      if (filters?.borrowTransactionType)
        query.borrowTransactionType = filters.borrowTransactionType;

      if (filters?.productName) {
        const regex = new RegExp(filters.productName, 'i');

        const matchedGroupIds = await this.productGroupModel
          .find({ name: regex })
          .distinct('_id');

        const matchedProductIds = await this.productModel
          .find({
            $or: [
              // { serialNumber: regex },
              { productGroupId: { $in: matchedGroupIds } },
            ],
          })
          .distinct('_id');

        query.productId = { $in: matchedProductIds };
      }

      const transactions = await this.borrowTransactionModel
        .find(query)
        .populate({
          path: 'productId',
          select:
            'qrCode serialNumber status reuseCount productGroupId productSizeId',
          populate: [
            {
              path: 'productGroupId',
              select: 'name imageUrl materialId',
              populate: {
                path: 'materialId',
                select: 'materialName',
              },
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
        .lean(); // nhẹ hơn 40–70%

      return {
        statusCode: HttpStatus.OK,
        message: 'Customer transaction history fetched successfully.',
        data: transactions,
      };
    } catch (error) {
      throw new HttpException(
        error?.message || 'Failed to fetch customer transaction history.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCustomerTransactionDetail(
    userId: string,
    transactionId: string,
  ): Promise<APIResponseDto> {
    try {
      const customer = await this.customerModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!customer) {
        throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      }

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
        .populate('customerId')
        .lean();

      if (!transaction) {
        throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Customer transaction detail fetched successfully.',
        data: transaction,
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to fetch transaction detail.',
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

      // make product available again
      if (transaction.productId) {
        await this.productModel.updateOne(
          { _id: transaction.productId },
          { status: 'available' },
          { session },
        );
      }

      transaction.status = 'canceled';
      await transaction.save({ session });

      await session.commitTransaction();

      return {
        statusCode: HttpStatus.OK,
        message: 'Transaction canceled successfully.',
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

  @Cron(CronExpression.EVERY_MINUTE, { timeZone: 'Asia/Ho_Chi_Minh' })
  async cancelExpiredBorrowTransactions() {
    const now = new Date();
    const autoCancelHours =
      this.configService.get<number>('borrowTransactions.autoCancelHours') ||
      24;
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

        transaction.status = 'canceled';
        await transaction.save();
      } catch (error) {
        throw new HttpException(
          (error as Error).message || 'Error cancelling expired transaction',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
