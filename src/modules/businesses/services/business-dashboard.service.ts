import { Model, Types } from 'mongoose';
import {
  Injectable,
  Inject,
  HttpStatus,
  NotFoundException,
  HttpException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import {
  Customers,
  CustomersDocument,
} from 'src/modules/users/schemas/customer.schema';
import {
  BusinessDocument,
  Businesses,
} from 'src/modules/businesses/schemas/businesses.schema';
import {
  BorrowTransaction,
  BorrowTransactionDocument,
} from 'src/modules/borrow-transactions/schemas/borrow-transactions.schema';
import {
  Material,
  MaterialDocument,
} from 'src/modules/materials/schemas/material.schema';
import { Staff, StaffDocument } from 'src/modules/staffs/schemas/staffs.schema';
import {
  BusinessVoucherDocument,
  BusinessVouchers,
} from 'src/modules/businesses/schemas/business-voucher.schema';
import {
  ProductGroup,
  ProductGroupDocument,
} from 'src/modules/product-groups/schemas/product-group.schema';
import {
  Product,
  ProductDocument,
} from 'src/modules/products/schemas/product.schema';
import {
  Vouchers,
  VouchersDocument,
} from 'src/modules/vouchers/schema/vouchers.schema';
import {
  WalletTransactions,
  WalletTransactionsDocument,
} from 'src/modules/wallet-transactions/schema/wallet-transactions.schema';
import {
  Feedback,
  FeedbackDocument,
} from 'src/modules/feedback/schemas/feedback.schema';
import {
  Wallets,
  WalletsDocument,
} from 'src/modules/wallets/schemas/wallets.schema';
import { GetBorrowStatsByMonthDto } from 'src/modules/admin/dto/admin-dashboard/get-borrow-stats-query.dto';
import { RolesEnum } from 'src/common/constants/roles.enum';

@Injectable()
export class BusinessDashboardService {
  constructor(
    @InjectModel(Customers.name)
    private readonly customerModel: Model<CustomersDocument>,

    @InjectModel(Businesses.name)
    private readonly businessModel: Model<BusinessDocument>,

    @InjectModel(Staff.name)
    private readonly staffModel: Model<StaffDocument>,

    @InjectModel(BorrowTransaction.name)
    private readonly borrowTransactionModel: Model<BorrowTransactionDocument>,

    @InjectModel(Material.name)
    private readonly materialModel: Model<MaterialDocument>,

    @InjectModel(BusinessVouchers.name)
    private readonly businessVoucherModel: Model<BusinessVoucherDocument>,

    @InjectModel(Vouchers.name)
    private readonly voucherModel: Model<VouchersDocument>,

    @InjectModel(ProductGroup.name)
    private readonly productGroupModel: Model<ProductGroupDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    @InjectModel(WalletTransactions.name)
    private readonly walletTransactionsModel: Model<WalletTransactionsDocument>,

    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<FeedbackDocument>,

    @InjectModel(Wallets.name)
    private readonly walletModel: Model<WalletsDocument>,
  ) {}

  //   Business get dashboard overview
  async getBusinessOverview(userId: string, role: RolesEnum[]) {
    const userObjectId = new Types.ObjectId(userId);

    let business;

    // 1. Role Staff
    if (role.includes(RolesEnum.STAFF)) {
      const staff = await this.staffModel.findOne({
        userId: userObjectId,
        status: 'active',
      });

      if (!staff) {
        throw new BadRequestException('Staff not found.');
      }

      business = await this.businessModel.findById(staff.businessId);
      if (!business) {
        throw new NotFoundException('Business not found for this staff.');
      }

      // override userId = business owner userId
      userId = business.userId.toString();
    }

    // 2. Role Business
    if (role.includes(RolesEnum.BUSINESS)) {
      business = await this.businessModel.findOne({
        userId: userObjectId,
      });

      if (!business) {
        throw new NotFoundException(`No business found for user '${userId}'.`);
      }
    }

    // 3. If no matching business
    if (!business) {
      throw new ForbiddenException('User cannot act on any business.');
    }

    const businessId = business._id;

    const [
      totalBorrowTransactions,
      totalBusinessVouchers,
      totalProductGroups,
      totalProductsAgg,
      totalStaffs,
      productConditionAgg, // 👈 new
    ] = await Promise.all([
      this.borrowTransactionModel.countDocuments({ businessId }),
      this.businessVoucherModel.countDocuments({ businessId }),
      this.productGroupModel.countDocuments({ businessId }),

      // count product join group
      this.productModel.aggregate([
        {
          $lookup: {
            from: 'productgroups',
            localField: 'productGroupId',
            foreignField: '_id',
            as: 'group',
          },
        },
        { $unwind: '$group' },
        { $match: { 'group.businessId': businessId, isDeleted: false } },
        { $count: 'total' },
      ]),

      this.staffModel.countDocuments({ businessId }),

      // 🔥 Count product by condition
      this.productModel.aggregate([
        {
          $lookup: {
            from: 'productgroups',
            localField: 'productGroupId',
            foreignField: '_id',
            as: 'group',
          },
        },
        { $unwind: '$group' },
        { $match: { 'group.businessId': businessId, isDeleted: false } },
        {
          $group: {
            _id: '$condition',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalProducts = totalProductsAgg[0]?.total || 0;

    // format condition result thành object
    const conditionStats: Record<string, number> = {
      good: 0,
      damaged: 0,
      expired: 0,
      lost: 0,
    };

    productConditionAgg.forEach((item) => {
      conditionStats[item._id] = item.count;
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Business dashboard overview loaded successfully',
      data: {
        borrowTransactions: totalBorrowTransactions,
        businessVouchers: totalBusinessVouchers,
        productGroups: totalProductGroups,
        products: totalProducts,
        staffs: totalStaffs,
        co2Reduced: business.co2Reduced,
        ecoPoints: business.ecoPoints,
        averageRating: business.averageRating,
        totalReviews: business.totalReviews,

        // 👇 New condition breakdown
        productConditionStats: conditionStats,
      },
    };
  }

  //   Business get borrow transaction monthly
  async getBusinessBorrowStatsByMonth(
    userId: string,
    query: GetBorrowStatsByMonthDto,
  ) {
    const { year, type, status } = query;
    const targetYear = year || new Date().getFullYear();
    const userObjectId = new Types.ObjectId(userId);

    const business = await this.businessModel
      .findOne({ userId: userObjectId })
      .lean();

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const businessId = business._id;

    const match: any = {
      businessId: businessId,
      borrowDate: {
        $gte: new Date(targetYear, 0, 1),
        $lte: new Date(targetYear, 11, 31, 23, 59, 59),
      },
    };

    if (type) match.borrowTransactionType = type;
    if (status) match.status = status;

    const monthly = await this.borrowTransactionModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { month: { $month: '$borrowDate' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    // 🎯 TÍNH TỔNG CÁC FIELD QUAN TRỌNG
    const totals = await this.borrowTransactionModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRewardPoints: { $sum: '$rewardPointChanged' },
          totalRankingPoints: { $sum: '$rankingPointChanged' },
          totalEcoPoints: { $sum: '$ecoPointChanged' },
          totalCo2Reduced: { $sum: '$co2Changed' },
          totalDepositAmount: { $sum: '$depositAmount' },
        },
      },
      {
        $project: {
          _id: 0,
          totalRewardPoints: 1,
          totalRankingPoints: 1,
          totalEcoPoints: 1,
          totalCo2Reduced: 1,
          totalDepositAmount: 1,
        },
      },
    ]);

    const formatted = Array.from({ length: 12 }, (_, i) => {
      const found = monthly.find((r) => r._id.month === i + 1);
      return {
        month: i + 1,
        count: found ? found.count : 0,
      };
    });

    return {
      statusCode: 200,
      message: 'Business borrow month statistics loaded successfully',
      year: targetYear,
      filter: {
        type: type ?? 'all',
        status: status ?? 'all',
      },
      data: formatted,
      totals: totals[0] ?? {
        totalRewardPoints: 0,
        totalRankingPoints: 0,
        totalEcoPoints: 0,
        totalCo2Reduced: 0,
        totalDepositAmount: 0,
      },
    };
  }

  // Business get top product
  async getBusinessTopProduct(userId: string, top: number = 5) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);
    }

    const business = await this.businessModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!business) {
      throw new HttpException('Business not found', HttpStatus.NOT_FOUND);
    }

    const businessId = business._id;

    const topBorrowedProducts = await this.productModel.aggregate([
      {
        $lookup: {
          from: 'productgroups',
          localField: 'productGroupId',
          foreignField: '_id',
          as: 'group',
        },
      },
      { $unwind: '$group' },
      {
        $lookup: {
          from: 'productsizes',
          localField: 'productSizeId',
          foreignField: '_id',
          as: 'size',
        },
      },
      { $unwind: '$size' },
      {
        $lookup: {
          from: 'materials',
          localField: 'group.materialId',
          foreignField: '_id',
          as: 'material',
        },
      },
      { $unwind: '$material' },
      {
        $match: {
          'group.businessId': businessId,
          isDeleted: false,
          reuseCount: { $gt: 0 },
        },
      },
      { $sort: { reuseCount: -1 } },
      { $limit: Number(top) },
      {
        $project: {
          _id: 1,
          serialNumber: 1,
          status: 1,
          condition: 1,
          reuseCount: 1,
          lastConditionNote: 1,
          lastConditionImages: 1,
          lastDamageFaces: 1,
          createdAt: 1,
          updatedAt: 1,
          'group._id': 1,
          'group.name': 1,
          'group.imageUrl': 1,
          // size info
          'size._id': 1,
          'size.sizeName': 1,
          'size.depositValue': 1,
          'size.description': 1,
          'size.plasticEquivalentWeight': 1,
          // material info
          'material._id': 1,
          'material.co2EmissionPerKg': 1,
        },
      },
    ]);

    // === Calculate co2Reduced for each product ===
    const productsWithEco = topBorrowedProducts.map((prod) => {
      let co2Reduced = 0;

      if (
        prod.size?.plasticEquivalentWeight &&
        prod.material?.co2EmissionPerKg
      ) {
        const plasticWeightKg = prod.size.plasticEquivalentWeight / 1000;
        const co2 = prod.material.co2EmissionPerKg;

        co2Reduced = Number((plasticWeightKg * co2).toFixed(3));
      }

      return {
        ...prod,
        co2Reduced,
      };
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Top borrowed products loaded successfully',
      data: {
        top,
        products: productsWithEco,
      },
    };
  }

  // Business get wallet transactions
  async getBusinessWalletStatsByMonth(userId: string, year?: number) {
    const targetYear = year ?? new Date().getFullYear();
    const userObjectId = new Types.ObjectId(userId);

    // Lấy business
    const business = await this.businessModel
      .findOne({ userId: userObjectId })
      .lean();
    if (!business) throw new NotFoundException('Business not found');

    // Lấy wallet
    const wallet = await this.walletModel.findOne({
      userId: userObjectId,
      type: 'business',
    });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const walletId = wallet._id;

    // =============================
    // AGGREGATION MONTHLY SUMMARY
    // =============================
    const monthlyTx = await this.walletTransactionsModel.aggregate([
      {
        $match: {
          walletId,
          status: 'completed',
          createdAt: {
            $gte: new Date(targetYear, 0, 1),
            $lte: new Date(targetYear, 11, 31, 23, 59, 59),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' } },

          totalIn: {
            $sum: { $cond: [{ $eq: ['$direction', 'in'] }, '$amount', 0] },
          },

          totalInAvailable: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$direction', 'in'] },
                    {
                      $or: [
                        { $eq: ['$balanceType', 'available'] },
                        {
                          $and: [
                            { $eq: ['$toBalanceType', 'available'] },
                            {
                              $in: [
                                '$transactionType',
                                ['penalty', 'deposit_forfeited'],
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },

          totalInHolding: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$direction', 'in'] },
                    { $eq: ['$balanceType', 'holding'] },
                    {
                      $not: [
                        {
                          $in: [
                            '$transactionType',
                            ['penalty', 'deposit_forfeited'],
                          ],
                        },
                      ],
                    },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },

          totalConvertedHolding: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$balanceType', 'holding'] },
                    { $eq: ['$toBalanceType', 'available'] },
                    {
                      $in: [
                        '$transactionType',
                        ['penalty', 'deposit_forfeited'],
                      ],
                    },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },

          totalOut: {
            $sum: { $cond: [{ $eq: ['$direction', 'out'] }, '$amount', 0] },
          },

          totalOutAvailable: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$direction', 'out'] },
                    { $eq: ['$balanceType', 'available'] },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },

          totalOutHolding: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$direction', 'out'] },
                    { $eq: ['$balanceType', 'holding'] },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },

          revenue: {
            $sum: {
              $cond: [
                { $in: ['$transactionType', ['penalty', 'deposit_forfeited']] },
                '$amount',
                0,
              ],
            },
          },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    // =============================
    // FORMAT 12 THÁNG
    // =============================
    const formatted = Array.from({ length: 12 }, (_, i) => {
      const m = monthlyTx.find((r) => r._id.month === i + 1);
      return {
        month: i + 1,
        totalIn: m?.totalIn || 0,
        totalInAvailable: m?.totalInAvailable || 0,
        totalInHolding: m?.totalInHolding || 0,
        totalOut: m?.totalOut || 0,
        totalOutAvailable: m?.totalOutAvailable || 0,
        totalHoldingConvertToAvailable: m?.totalConvertedHolding || 0,
        totalHoldingReturnToCustomer: m?.totalOutHolding || 0,
        net: m ? m.totalInAvailable - m.totalOutAvailable : 0,
        revenue: m?.revenue || 0,
      };
    });

    // =============================
    // TOTAL SUMMARY FULL YEAR
    // =============================
    const totals = await this.walletTransactionsModel.aggregate([
      {
        $match: {
          walletId,
          status: 'completed',
          createdAt: {
            $gte: new Date(targetYear, 0, 1),
            $lte: new Date(targetYear, 11, 31, 23, 59, 59),
          },
        },
      },
      {
        $group: {
          _id: null,

          totalIn: {
            $sum: { $cond: [{ $eq: ['$direction', 'in'] }, '$amount', 0] },
          },

          totalInAvailable: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$direction', 'in'] },
                    {
                      $or: [
                        { $eq: ['$balanceType', 'available'] },
                        {
                          $and: [
                            { $eq: ['$toBalanceType', 'available'] },
                            {
                              $in: [
                                '$transactionType',
                                ['penalty', 'deposit_forfeited'],
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },

          totalInHolding: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$direction', 'in'] },
                    { $eq: ['$balanceType', 'holding'] },
                    {
                      $not: [
                        {
                          $in: [
                            '$transactionType',
                            ['penalty', 'deposit_forfeited'],
                          ],
                        },
                      ],
                    },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },

          totalConvertedHolding: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$balanceType', 'holding'] },
                    { $eq: ['$toBalanceType', 'available'] },
                    {
                      $in: [
                        '$transactionType',
                        ['penalty', 'deposit_forfeited'],
                      ],
                    },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },

          totalOut: {
            $sum: { $cond: [{ $eq: ['$direction', 'out'] }, '$amount', 0] },
          },

          totalOutAvailable: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$direction', 'out'] },
                    { $eq: ['$balanceType', 'available'] },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },

          totalOutHolding: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$direction', 'out'] },
                    { $eq: ['$balanceType', 'holding'] },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },

          revenue: {
            $sum: {
              $cond: [
                { $in: ['$transactionType', ['penalty', 'deposit_forfeited']] },
                '$amount',
                0,
              ],
            },
          },
        },
      },
      { $project: { _id: 0 } },
    ]);

    return {
      statusCode: 200,
      message: 'Business wallet monthly statistics loaded successfully',
      year: targetYear,
      data: formatted,
      totals: {
        month: 12,
        totalIn: totals[0]?.totalIn || 0,
        totalInAvailable: totals[0]?.totalInAvailable || 0,
        totalInHolding: totals[0]?.totalInHolding || 0,
        totalOut: totals[0]?.totalOut || 0,
        totalOutAvailable: totals[0]?.totalOutAvailable || 0,
        totalHoldingConvertToAvailable: totals[0]?.totalConvertedHolding || 0,
        totalHoldingReturnToCustomer: totals[0]?.totalOutHolding || 0,
        net: totals[0]
          ? totals[0].totalInAvailable - totals[0].totalOutAvailable
          : 0,
        revenue: totals[0]?.revenue || 0,
      },
    };
  }
}
