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
}
