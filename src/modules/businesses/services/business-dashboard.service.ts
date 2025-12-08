import { Model, Types } from 'mongoose';
import {
  Injectable,
  Inject,
  HttpStatus,
  NotFoundException,
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
    private readonly walletTransactionModel: Model<WalletTransactionsDocument>,

    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<FeedbackDocument>,

    @InjectModel(Wallets.name)
    private readonly walletModel: Model<WalletsDocument>,
  ) {}

  //   Business get dashboard overview
  async getBusinessOverview(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    const business = await this.businessModel.findOne({ userId: userObjectId });

    if (!business) {
      throw new NotFoundException('Business not found for this user');
    }

    const businessId = business._id;

    const [
      totalBorrowTransactions,
      totalBusinessVouchers,
      totalProductGroups,
      totalProducts,
      totalStaffs,
    ] = await Promise.all([
      // Borrow transactions of this business
      this.borrowTransactionModel.countDocuments({
        businessId: businessId,
      }),

      // Business vouchers created by this business
      this.businessVoucherModel.countDocuments({
        businessId: businessId,
      }),

      // Product groups
      this.productGroupModel.countDocuments({ businessId: businessId }),

      // Products
      this.productModel.countDocuments({ businessId: businessId }),

      // Staffs
      this.staffModel.countDocuments({ businessId: businessId }),
    ]);

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
}
