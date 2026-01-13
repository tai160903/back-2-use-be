import { Connection, Model, Types } from 'mongoose';
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  BorrowTransaction,
  BorrowTransactionDocument,
} from 'src/modules/borrow-transactions/schemas/borrow-transactions.schema';
import {
  SingleUseProduct,
  SingleUseProductDocument,
} from 'src/modules/single-use-product/schemas/single-use-product.schema';
import {
  SingleUseProductUsage,
  SingleUseProductUsageDocument,
} from 'src/modules/single-use-product-usage/schemas/single-use-product-usage.schema';
import { Staff, StaffDocument } from 'src/modules/staffs/schemas/staffs.schema';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { paginate } from 'src/common/utils/pagination.util';
import { GetSingleUseUsageQueryDto } from './dto/get-single-use-product-usage.dto';
import {
  BusinessDocument,
  Businesses,
} from '../businesses/schemas/businesses.schema';
import { Customers, CustomersDocument } from '../users/schemas/customer.schema';

@Injectable()
export class SingleUseProductUsageService {
  constructor(
    @InjectModel(BorrowTransaction.name)
    private readonly borrowTransactionModel: Model<BorrowTransactionDocument>,

    @InjectModel(SingleUseProductUsage.name)
    private readonly usageModel: Model<SingleUseProductUsageDocument>,

    @InjectModel(Businesses.name)
    private readonly businessModel: Model<BusinessDocument>,

    @InjectModel(Staff.name)
    private readonly staffModel: Model<StaffDocument>,

    @InjectModel(Customers.name)
    private readonly customerModel: Model<CustomersDocument>,
  ) {}

  async getUsagesByBorrowTransaction(
    borrowTransactionId: string,
    query: GetSingleUseUsageQueryDto,
  ): Promise<APIPaginatedResponseDto<any[]>> {
    const { page = 1, limit = 10 } = query;

    const borrow = await this.borrowTransactionModel.findById(
      new Types.ObjectId(borrowTransactionId),
    );

    if (!borrow) {
      throw new NotFoundException('Borrow transaction not found');
    }

    const filter = {
      borrowTransactionId: borrow._id,
    };

    const { data, total, currentPage, totalPages } =
      await paginate<SingleUseProductUsageDocument>(
        this.usageModel,
        filter,
        page,
        limit,
        undefined,
        { createdAt: 1 },
        [
          {
            path: 'singleUseProductId',
            select:
              'name imageUrl co2Emission weight productTypeId productSizeId materialId',
            populate: [
              { path: 'productTypeId', select: 'name' },
              { path: 'productSizeId', select: 'sizeName' },
              { path: 'materialId', select: 'materialName' },
            ],
          },
          {
            path: 'staffId',
            select: 'fullName email phone',
          },
        ],
      );

    const normalizedData = data.map((usage: any) => {
      const product = usage.singleUseProductId;
      const staff = usage.staffId;

      return {
        _id: usage._id,
        borrowTransactionId: usage.borrowTransactionId,
        blockchainTxHash: usage.blockchainTxHash,
        createdAt: usage.createdAt,
        co2PerUnit: usage.co2PerUnit,

        staff: staff
          ? {
              id: staff._id,
              fullName: staff.fullName,
              email: staff.email,
              phone: staff.phone,
            }
          : null,

        product: product
          ? {
              id: product._id,

              // 🔑 CÁC ID BẠN ĐANG TÌM
              productTypeId: product.productTypeId?._id,
              productSizeId: product.productSizeId?._id,
              materialId: product.materialId?._id,

              name: product.name,
              imageUrl: product.imageUrl,
              weight: product.weight,
              co2Emission: product.co2Emission,

              type: product.productTypeId?.name,
              size: product.productSizeId?.sizeName,
              material: product.materialId?.materialName,
            }
          : null,
      };
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Single-use consumption history fetched successfully',
      data: normalizedData,
      total,
      currentPage,
      totalPages,
    };
  }

  async getAllMySingleUseUsages(
    userId: string,
    role: RolesEnum[],
    query: GetSingleUseUsageQueryDto,
  ): Promise<APIPaginatedResponseDto<any[]>> {
    const { page = 1, limit = 10 } = query;

    let business;
    let customer;

    // =========================
    // ROLE STAFF
    // =========================
    if (role.includes(RolesEnum.STAFF)) {
      const staff = await this.staffModel.findOne({
        userId: new Types.ObjectId(userId),
        status: 'active',
      });

      if (!staff) {
        throw new BadRequestException('Staff not found.');
      }

      business = await this.businessModel.findById(
        new Types.ObjectId(staff.businessId),
      );

      if (!business) {
        throw new NotFoundException('Business not found for this staff.');
      }
    }

    // =========================
    // ROLE BUSINESS
    // =========================
    if (role.includes(RolesEnum.BUSINESS)) {
      business = await this.businessModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!business) {
        throw new NotFoundException(`No business found for user '${userId}'.`);
      }
    }

    // =========================
    // ROLE CUSTOMER
    // =========================
    if (role.includes(RolesEnum.CUSTOMER)) {
      customer = await this.customerModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!customer) {
        throw new NotFoundException('Customer not found.');
      }
    }

    // =========================
    // BUILD FILTER
    // =========================
    const filter: any = {};

    if (business) {
      filter.businessId = new Types.ObjectId(business._id);
    }

    if (customer) {
      filter.customerId = new Types.ObjectId(customer._id);
    }

    if (!business && !customer) {
      throw new ForbiddenException('User cannot access single-use usages.');
    }

    // =========================
    // QUERY + PAGINATE
    // =========================
    const { data, total, currentPage, totalPages } =
      await paginate<SingleUseProductUsageDocument>(
        this.usageModel,
        filter,
        page,
        limit,
        undefined,
        { createdAt: -1 },
        [
          {
            path: 'singleUseProductId',
            select:
              'name imageUrl co2Emission weight productTypeId productSizeId materialId',
            populate: [
              { path: 'productTypeId', select: 'name' },
              { path: 'productSizeId', select: 'sizeName' },
              { path: 'materialId', select: 'materialName' },
            ],
          },
          {
            path: 'staffId',
            select: 'fullName email phone',
          },
        ],
      );

    // =========================
    // NORMALIZE RESPONSE
    // =========================
    const normalizedData = data.map((usage: any) => {
      const product = usage.singleUseProductId;
      const staff = usage.staffId;

      return {
        _id: usage._id,
        borrowTransactionId: usage.borrowTransactionId,
        blockchainTxHash: usage.blockchainTxHash,
        createdAt: usage.createdAt,
        co2PerUnit: usage.co2PerUnit,

        staff: staff
          ? {
              id: staff._id,
              fullName: staff.fullName,
              email: staff.email,
              phone: staff.phone,
            }
          : null,

        product: product
          ? {
              id: product._id,

              productTypeId: product.productTypeId?._id,
              productSizeId: product.productSizeId?._id,
              materialId: product.materialId?._id,

              name: product.name,
              imageUrl: product.imageUrl,
              weight: product.weight,
              co2Emission: product.co2Emission,

              type: product.productTypeId?.name,
              size: product.productSizeId?.sizeName,
              material: product.materialId?.materialName,
            }
          : null,
      };
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Single-use usage history fetched successfully',
      data: normalizedData,
      total,
      currentPage,
      totalPages,
    };
  }
}
