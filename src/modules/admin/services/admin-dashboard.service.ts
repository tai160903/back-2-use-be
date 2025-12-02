import { Model } from 'mongoose';
import { Injectable, Inject, HttpStatus } from '@nestjs/common';
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
import { GetTopCustomersQueryDto } from '../dto/admin-dashboard/get-top-customers-query.dto';
import { GetTopBusinessesQueryDto } from '../dto/admin-dashboard/get-top-business-query.dto';
import { GetBorrowStatsByMonthDto } from '../dto/admin-dashboard/get-borrow-stats-query.dto';
import { GetWalletByMonthDto } from '../dto/admin-dashboard/get-wallet-transaction-query.dto';

@Injectable()
export class AdminDashboardService {
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
    private readonly walletTransactionModel: Model<WalletTransactionsDocument>,

    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<FeedbackDocument>,

    @InjectModel(Wallets.name)
    private readonly walletModel: Model<WalletsDocument>,
  ) {}

  async getOverview() {
    const [
      totalCustomers,
      totalBusinesses,
      totalStaffs,
      totalBorrowTransactions,
      totalMaterials,
      totalBusinessVouchers,
      totalLeaderboardVouchers,
      totalProductGroups,
      totalProducts,
      totalWalletTransactions,

      // TOTAL CO2
      totalCo2ReducedResult,

      // TOTAL REUSES
      totalReusesResult,

      // RETURN SUCCESS COUNT
      returnSuccessResult,

      // RETURN FAILED COUNT
      returnFailedResult,

      // AVG RATING
      averageRatingResult,

      // TOTAL MONEY (all wallets)
      totalMoneyResult,
    ] = await Promise.all([
      this.customerModel.countDocuments(),
      this.businessModel.countDocuments(),
      this.staffModel.countDocuments(),
      this.borrowTransactionModel.countDocuments(),
      this.materialModel.countDocuments(),
      this.businessVoucherModel.countDocuments(),
      this.voucherModel.countDocuments(),
      this.productGroupModel.countDocuments(),
      this.productModel.countDocuments(),
      this.walletTransactionModel.countDocuments(),

      // total CO2
      this.borrowTransactionModel.aggregate([
        { $group: { _id: null, total: { $sum: '$co2Changed' } } },
      ]),

      // total reuses
      this.productModel.aggregate([
        { $group: { _id: null, total: { $sum: '$reuseCount' } } },
      ]),

      // return success
      this.borrowTransactionModel.aggregate([
        { $match: { borrowTransactionType: 'return_success' } },
        { $count: 'total' },
      ]),

      // return failed
      this.borrowTransactionModel.aggregate([
        { $match: { borrowTransactionType: 'return_failed' } },
        { $count: 'total' },
      ]),

      // average rating
      this.feedbackModel.aggregate([
        {
          $group: {
            _id: null,
            totalRating: { $sum: '$rating' },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            averageRating: {
              $cond: [
                { $eq: ['$count', 0] },
                0,
                { $divide: ['$totalRating', '$count'] },
              ],
            },
          },
        },
      ]),

      // total money in system (all wallets)
      this.walletModel.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $add: ['$availableBalance', '$holdingBalance'],
              },
            },
          },
        },
      ]),
    ]);

    // Extract values safely
    const totalCo2Reduced =
      totalCo2ReducedResult.length > 0 ? totalCo2ReducedResult[0].total : 0;

    const totalReuses =
      totalReusesResult.length > 0 ? totalReusesResult[0].total : 0;

    const totalReturnSuccess =
      returnSuccessResult.length > 0 ? returnSuccessResult[0].total : 0;

    const totalReturnFailed =
      returnFailedResult.length > 0 ? returnFailedResult[0].total : 0;

    const totalReturnEvents = totalReturnSuccess + totalReturnFailed;

    const returnRate =
      totalReturnEvents > 0
        ? (totalReturnSuccess / totalReturnEvents) * 100
        : 0;

    const averageRating =
      averageRatingResult.length > 0 ? averageRatingResult[0].averageRating : 0;

    const totalMoneyInSystem =
      totalMoneyResult.length > 0 ? totalMoneyResult[0].total : 0;

    return {
      statusCode: HttpStatus.OK,
      message: 'Admin dashboard overview loaded successfully',
      data: {
        users: {
          customers: totalCustomers,
          businesses: totalBusinesses,
          staffs: totalStaffs,
        },
        vouchers: {
          businessVouchers: totalBusinessVouchers,
          leaderboardVouchers: totalLeaderboardVouchers,
        },
        transactions: {
          borrowTransactions: totalBorrowTransactions,
          walletTransactions: totalWalletTransactions,
        },
        products: {
          groups: totalProductGroups,
          products: totalProducts,
        },
        materials: totalMaterials,
        co2Reduced: totalCo2Reduced,
        totalReuses: totalReuses,
        returnRate: returnRate,
        averageRating: averageRating,
        totalMoneyInSystem: totalMoneyInSystem,
      },
    };
  }

  // Admin get customer by month
  async getCustomerStatsByMonth(year?: number) {
    const targetYear = year || new Date().getFullYear();

    const result = await this.customerModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(targetYear, 0, 1),
            $lte: new Date(targetYear, 11, 31, 23, 59, 59),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    // Convert về format 12 tháng (nếu tháng nào không có user thì count = 0)
    const formatted = Array.from({ length: 12 }, (_, i) => {
      const found = result.find((r) => r._id.month === i + 1);
      return {
        month: i + 1,
        count: found ? found.count : 0,
      };
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Get customer by month loaded successfully',
      year: targetYear,
      data: formatted,
    };
  }

  // Admin get top customer
  async getTopCustomers(query: GetTopCustomersQueryDto) {
    const { top = 0, sortBy = 'rankingPoints', order = 'desc' } = query;

    // Lấy tất cả để tính returnRate trước
    let customers = await this.customerModel
      .find()
      .populate({
        path: 'userId',
        select: 'avatar',
      })
      .lean();

    // Tính returnRate
    customers = customers.map((c: any) => {
      const totalReturns =
        (c.returnSuccessCount ?? 0) + (c.returnFailedCount ?? 0);

      const returnRate =
        totalReturns > 0 ? (c.returnSuccessCount / totalReturns) * 100 : 0;

      return {
        ...c,
        returnRate,
      };
    });

    // Sort sau khi đã có returnRate
    const key: 'rankingPoints' | 'rewardPoints' | 'returnRate' = sortBy;

    customers.sort((a: any, b: any) => {
      const valA = a[key] ?? 0;
      const valB = b[key] ?? 0;

      if (order === 'asc') return valA - valB;
      return valB - valA;
    });

    // Apply top limit
    if (top > 0) {
      customers = customers.slice(0, top);
    }

    return {
      status: HttpStatus.OK,
      message: 'Get top customer successfully',
      top,
      data: customers,
    };
  }

  // Admin get business by month
  async getBusinessStatsByMonth(year?: number) {
    const targetYear = year || new Date().getFullYear();

    const result = await this.businessModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(targetYear, 0, 1),
            $lte: new Date(targetYear, 11, 31, 23, 59, 59),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    // Format đủ 12 tháng
    const formatted = Array.from({ length: 12 }, (_, i) => {
      const found = result.find((r) => r._id.month === i + 1);
      return {
        month: i + 1,
        count: found ? found.count : 0,
      };
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Get business by month loaded successfully',
      year: targetYear,
      data: formatted,
    };
  }

  // Admin get top business
  async getTopBusinesses(query: GetTopBusinessesQueryDto) {
    const { top = 0, sortBy = 'co2Reduced', order = 'desc' } = query;

    // Lấy tất cả business
    let businesses = await this.businessModel.find();

    // Sort theo co2Reduced hoặc ecoPoints
    const key: 'co2Reduced' | 'ecoPoints' | 'averageRating' = sortBy;

    businesses.sort((a: any, b: any) => {
      const valA = a[key] ?? 0;
      const valB = b[key] ?? 0;

      if (order === 'asc') return valA - valB;
      return valB - valA;
    });

    // lấy top n
    if (top > 0) {
      businesses = businesses.slice(0, top);
    }

    return {
      status: HttpStatus.OK,
      message: 'Get top business successfully',
      top,
      data: businesses,
    };
  }

  // Admin get borrow transactions by month
  async getBorrowStatsByMonth(query: GetBorrowStatsByMonthDto) {
    const { year, type, status } = query;
    const targetYear = year || new Date().getFullYear();

    const match: any = {
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
      message: 'Get borrow stats by month successfully',
      year: targetYear,
      filter: { type: type ?? 'all', status: status ?? 'all' },
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

  // Admin get wallet transactions overview
  async getWalletTransactionsOverview() {
    const result = await this.walletTransactionModel.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalTopUp: {
            $sum: {
              $cond: [{ $eq: ['$transactionType', 'top_up'] }, '$amount', 0],
            },
          },
          totalWithdraw: {
            $sum: {
              $cond: [
                { $eq: ['$transactionType', 'withdrawal'] },
                '$amount',
                0,
              ],
            },
          },
          totalDeposit: {
            $sum: {
              $cond: [
                { $eq: ['$transactionType', 'borrow_deposit'] },
                '$amount',
                0,
              ],
            },
          },
          totalRefund: {
            $sum: {
              $cond: [
                { $eq: ['$transactionType', 'return_refund'] },
                '$amount',
                0,
              ],
            },
          },
          totalSubscriptionFee: {
            $sum: {
              $cond: [
                { $eq: ['$transactionType', 'subscription_fee'] },
                '$amount',
                0,
              ],
            },
          },
          totalPenalty: {
            $sum: {
              $cond: [{ $eq: ['$transactionType', 'penalty'] }, '$amount', 0],
            },
          },
          totalForfeited: {
            $sum: {
              $cond: [
                { $eq: ['$transactionType', 'deposit_forfeited'] },
                '$amount',
                0,
              ],
            },
          },
        },
      },
    ]);

    return {
      status: 200,
      message: 'Wallet overview loaded successfully',
      data: result[0] || {},
    };
  }

  // Admin get wallet transactions by month
  async getWalletTransactionsByMonth(query: GetWalletByMonthDto) {
    const { year, transactionType, direction, status } = query;
    const targetYear = year || new Date().getFullYear();

    const match: any = {
      createdAt: {
        $gte: new Date(targetYear, 0, 1),
        $lte: new Date(targetYear, 11, 31, 23, 59, 59),
      },
    };

    if (transactionType) match.transactionType = transactionType;
    if (direction) match.direction = direction;
    if (status) match.status = status;

    const result = await this.walletTransactionModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { month: { $month: '$createdAt' } },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    const formatted = Array.from({ length: 12 }, (_, i) => {
      const found = result.find((r) => r._id.month === i + 1);
      return {
        month: i + 1,
        count: found?.count || 0,
        totalAmount: found?.totalAmount || 0,
      };
    });

    return {
      status: 200,
      message: 'Wallet transactions by month loaded successfully',
      year: targetYear,
      filter: { transactionType, direction, status },
      data: formatted,
    };
  }
}
