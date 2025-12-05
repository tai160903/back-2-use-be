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
      totalFeedbacks,
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

      // Feedback given to this business
      this.feedbackModel.countDocuments({ businessId: businessId }),

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
        feedbacks: totalFeedbacks,
        productGroups: totalProductGroups,
        products: totalProducts,
        staffs: totalStaffs,
      },
    };
  }

  //   Business get borrow transaction monthly
  
}
