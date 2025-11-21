import {
  HttpStatus,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  WalletTransactions,
  WalletTransactionsDocument,
} from './schema/wallet-transactions.schema';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import {
  GetWalletTransactionsQueryDto,
  TransactionFilterGroup,
} from './dto/get-wallet-transactions-query.dto';
import { paginate } from 'src/common/utils/pagination.util';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { TransactionType } from 'src/common/constants/transaction-type.enum';
import { Wallets, WalletsDocument } from '../wallets/schemas/wallets.schema';
import {
  BusinessDocument,
  Businesses,
} from '../businesses/schemas/businesses.schema';
import { Customers, CustomersDocument } from '../users/schemas/customer.schema';
import {
  BorrowTransaction,
  BorrowTransactionDocument,
} from '../borrow-transactions/schemas/borrow-transactions.schema';
import {
  BusinessSubscriptions,
  BusinessSubscriptionsDocument,
} from '../businesses/schemas/business-subscriptions.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import {
  ProductGroup,
  ProductGroupDocument,
} from '../product-groups/schemas/product-group.schema';
import {
  ProductSize,
  ProductSizeDocument,
} from '../product-sizes/schemas/product-size.schema';

@Injectable()
export class WalletTransactionsService {
  constructor(
    @InjectModel(WalletTransactions.name)
    private readonly walletTransactionsModel: Model<WalletTransactionsDocument>,

    @InjectModel(Wallets.name)
    private readonly walletModel: Model<WalletsDocument>,

    @InjectModel(Businesses.name)
    private readonly businessModel: Model<BusinessDocument>,

    @InjectModel(Customers.name)
    private readonly customerModel: Model<CustomersDocument>,

    @InjectModel(BorrowTransaction.name)
    private readonly borrowTransactionsModel: Model<BorrowTransactionDocument>,

    @InjectModel(BusinessSubscriptions.name)
    private readonly businessSubscriptionsModel: Model<BusinessSubscriptionsDocument>,

    @InjectModel(Product.name)
    private readonly productsModel: Model<ProductDocument>,

    @InjectModel(ProductGroup.name)
    private readonly productGroupsModel: Model<ProductGroupDocument>,

    @InjectModel(ProductSize.name)
    private readonly productSizesModel: Model<ProductSizeDocument>,
  ) {}

  // Get wallet transactions by userId
  async getMyWalletTransactions(
    userId: string,
    query: GetWalletTransactionsQueryDto,
  ): Promise<APIPaginatedResponseDto<WalletTransactions[]>> {
    const { direction, typeGroup, page = 1, limit = 10, walletType } = query;

    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    // STEP 1: Determine which wallet belongs to user
    const wallet = await this.walletModel.findOne({
      userId: new Types.ObjectId(userId),
      type: walletType || 'customer',
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet of type '${walletType}' not found`);
    }

    // STEP 2: Build filter
    const filter: any = {
      walletId: wallet._id,
    };

    if (direction) {
      filter.direction = direction;
    }

    // STEP 3: Filter by grouped transaction types
    switch (typeGroup) {
      case TransactionFilterGroup.PERSONAL:
        filter.transactionType = {
          $in: [
            TransactionType.TOP_UP,
            TransactionType.WITHDRAWAL,
            TransactionType.SUBSCRIPTION_FEE,
          ],
        };
        break;

      case TransactionFilterGroup.DEPOSIT_REFUND:
        filter.transactionType = {
          $in: [
            TransactionType.BORROW_DEPOSIT,
            TransactionType.RETURN_REFUND,
            TransactionType.DEPOSIT_FORFEITED,
          ],
        };
        break;

      case TransactionFilterGroup.PENALTY:
        filter.transactionType = TransactionType.PENALTY;
        break;
    }

    // STEP 4: Paginate
    const { data, total, currentPage, totalPages } =
      await paginate<WalletTransactionsDocument>(
        this.walletTransactionsModel,
        filter,
        page,
        limit,
      );

    return {
      statusCode: HttpStatus.OK,
      message: `Get ${walletType} wallet transactions successfully`,
      data,
      total,
      currentPage,
      totalPages,
    };
  }

  // Get detail transaction by id
  async getTransactionById(id: string): Promise<APIResponseDto<any>> {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid transaction ID', HttpStatus.BAD_REQUEST);
    }

    const objectId = new Types.ObjectId(id);

    const result = await this.walletTransactionsModel.aggregate([
      { $match: { _id: objectId } },

      // ====== Populate relatedUser ======
      {
        $lookup: {
          from: 'businesses',
          localField: 'relatedUserId',
          foreignField: '_id',
          as: 'businessUser',
          pipeline: [
            {
              $project: {
                _id: 1,
                businessName: 1,
                businessMail: 1,
                businessPhone: 1,
                status: 1,
                businessLogoUrl: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'relatedUserId',
          foreignField: '_id',
          as: 'customerUser',
          pipeline: [
            {
              $project: {
                _id: 1,
                fullName: 1,
                phone: 1,
                address: 1,
                yob: 1,
              },
            },
          ],
        },
      },

      // chọn đúng user
      {
        $addFields: {
          relatedUser: {
            $cond: [
              { $eq: ['$relatedUserType', 'business'] },
              { $arrayElemAt: ['$businessUser', 0] },
              { $arrayElemAt: ['$customerUser', 0] },
            ],
          },
        },
      },

      { $project: { businessUser: 0, customerUser: 0 } },

      // ====== Populate reference ======
      {
        $lookup: {
          from: 'borrowtransactions',
          localField: 'referenceId',
          foreignField: '_id',
          as: 'borrowRef',
        },
      },

      //  THÊM LOOKUP businesssubscriptions
      {
        $lookup: {
          from: 'businesssubscriptions',
          localField: 'referenceId',
          foreignField: '_id',
          as: 'subscriptionRef',
          pipeline: [
            {
              $project: {
                _id: 1,
                subscriptionId: 1,
                startDate: 1,
                endDate: 1,
                status: 1,
              },
            },

            // Populate subscriptionId → subscriptions
            {
              $lookup: {
                from: 'subscriptions',
                localField: 'subscriptionId',
                foreignField: '_id',
                as: 'subscription',
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      price: 1,
                      durationInDays: 1,
                    },
                  },
                ],
              },
            },

            {
              $unwind: {
                path: '$subscription',
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
        },
      },

      {
        $addFields: {
          reference: {
            $cond: [
              { $eq: ['$referenceType', 'borrow'] },
              { $arrayElemAt: ['$borrowRef', 0] },
              { $arrayElemAt: ['$subscriptionRef', 0] },
            ],
          },
        },
      },

      { $project: { borrowRef: 0, subscriptionRef: 0 } },

      // ====== Populate product if borrow ======
      {
        $lookup: {
          from: 'products',
          localField: 'reference.productId',
          foreignField: '_id',
          as: 'product',
          pipeline: [
            {
              $project: {
                _id: 1,
                serialNumber: 1,
                status: 1,
                condition: 1,
                qrCode: 1,
                productGroupId: 1,
                productSizeId: 1,
              },
            },

            {
              $lookup: {
                from: 'productgroups',
                localField: 'productGroupId',
                foreignField: '_id',
                as: 'productGroup',
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      description: 1,
                      imageUrl: 1,
                    },
                  },
                ],
              },
            },
            {
              $unwind: {
                path: '$productGroup',
                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $lookup: {
                from: 'productsizes',
                localField: 'productSizeId',
                foreignField: '_id',
                as: 'productSize',
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      sizeName: 1,
                      depositValue: 1,
                    },
                  },
                ],
              },
            },
            {
              $unwind: {
                path: '$productSize',
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
        },
      },

      {
        $addFields: {
          'reference.product': { $arrayElemAt: ['$product', 0] },
        },
      },

      { $project: { product: 0 } },
    ]);

    if (!result || !result[0]) {
      throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Get transaction detail successfully',
      data: result[0],
    };
  }
}
