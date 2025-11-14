import {
  BadRequestException,
  Injectable,
  NotFoundException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Connection, Model, Types } from 'mongoose';
import {
  Vouchers,
  VouchersDocument,
} from 'src/modules/vouchers/schema/vouchers.schema';
import {
  VoucherCodes,
  VoucherCodesDocument,
} from 'src/modules/voucher-codes/schema/voucher-codes.schema';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { VoucherCodeStatus } from 'src/common/constants/voucher-codes-status.enum';
import { generateRandomString } from 'src/common/utils/generate-random-string.util';
import { Customers, CustomersDocument } from '../users/schemas/customer.schema';
import { RedeemVoucherDto } from './dto/redeem-voucher.dto';
import { VouchersStatus } from 'src/common/constants/vouchers-status.enum';
import { paginate } from 'src/common/utils/pagination.util';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import {
  BusinessVoucherDocument,
  BusinessVouchers,
} from '../businesses/schemas/business-voucher.schema';
import {
  CustomerVoucherFilterStatus,
  GetAllVouchersQueryDto,
} from './dto/get-all-active-voucher.dto';
import { GetMyVouchersQueryDto } from './dto/get-my-voucher-query.dto';
import { VoucherType } from 'src/common/constants/voucher-types.enum';

@Injectable()
export class VouchersService {
  constructor(
    @InjectModel(Vouchers.name)
    private readonly voucherModel: Model<VouchersDocument>,

    @InjectModel(BusinessVouchers.name)
    private readonly businessVoucherModel: Model<BusinessVoucherDocument>,

    @InjectModel(VoucherCodes.name)
    private readonly voucherCodeModel: Model<VoucherCodesDocument>,

    @InjectModel(Customers.name)
    private readonly customerModel: Model<CustomersDocument>,

    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  // Customer redeem voucher
  async redeemVoucher(
    userId: string,
    redeemVoucherDto: RedeemVoucherDto,
  ): Promise<APIResponseDto<VoucherCodes>> {
    const { voucherId } = redeemVoucherDto;
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const now = new Date();

      const voucher = await this.businessVoucherModel
        .findById(voucherId)
        .session(session);

      if (!voucher) throw new NotFoundException('Voucher not found');
      if (!voucher.isPublished)
        throw new BadRequestException('Voucher is not published');
      if (voucher.status !== VouchersStatus.ACTIVE)
        throw new BadRequestException('Voucher is not active');
      if (voucher.endDate < now)
        throw new BadRequestException('Voucher has expired');
      if (voucher.maxUsage && voucher.redeemedCount >= voucher.maxUsage)
        throw new BadRequestException('Voucher has reached max usage');

      //  Lấy customer
      const customer = await this.customerModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .session(session);
      if (!customer) throw new NotFoundException('Customer not found');

      // Kiểm tra đã redeem chưa
      const existingCode = await this.voucherCodeModel
        .findOne({
          voucherId: new Types.ObjectId(voucherId),
          redeemedBy: new Types.ObjectId(userId),
        })
        .session(session);

      if (existingCode)
        throw new BadRequestException('You have already redeemed this voucher');

      if (customer.rewardPoints < voucher.rewardPointCost)
        throw new BadRequestException('Not enough reward points');

      customer.rewardPoints -= voucher.rewardPointCost;
      await customer.save({ session });

      // Tạo voucher code
      let voucherCode: VoucherCodesDocument | null = null;

      for (let i = 0; i < 3; i++) {
        const randomSuffix = generateRandomString(6);
        const fullCode = `${voucher.baseCode}-${randomSuffix}`;

        try {
          voucherCode = new this.voucherCodeModel({
            voucherId: voucher._id,
            voucherType: VoucherType.BUSINESS,
            businessId: voucher.businessId ?? undefined,
            redeemedBy: new Types.ObjectId(userId),
            fullCode,
            status: VoucherCodeStatus.REDEEMED,
            redeemedAt: now,
          });

          await voucherCode.save({ session });
          break;
        } catch (err) {
          if (err.code === 11000 && err.keyPattern?.fullCode) continue;
          throw err;
        }
      }

      if (!voucherCode)
        throw new InternalServerErrorException(
          'Failed to generate unique voucher code',
        );

      // Cập nhật redeemedCount
      voucher.redeemedCount += 1;
      await voucher.save({ session });

      await session.commitTransaction();

      return {
        statusCode: HttpStatus.OK,
        message: 'Redeem voucher successfully',
        data: voucherCode,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  //Get all business voucher
  async getAllVouchers(
    userId: string,
    query: GetAllVouchersQueryDto,
  ): Promise<APIPaginatedResponseDto<any>> {
    const { page = 1, limit = 10, status } = query;

    const filter: any = { isPublished: true };
    if (status) filter.status = status;

    const { data, total, currentPage, totalPages } =
      await paginate<BusinessVoucherDocument>(
        this.businessVoucherModel,
        filter,
        page,
        limit,
      );

    const customer = await this.customerModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const redeemed = await this.voucherCodeModel.find({
      redeemedBy: new Types.ObjectId(userId),
    });
    const redeemedVoucherIds = new Set(
      redeemed.map((v) => v.voucherId.toString()),
    );

    // Gắn isRedeemable
    const enrichedData = data.map((v) => ({
      ...v.toObject(),
      isRedeemable:
        // v.isPublished === true &&
        v.status === VouchersStatus.ACTIVE &&
        customer?.rewardPoints >= (v.rewardPointCost ?? 0) &&
        !redeemedVoucherIds.has(v._id.toString()),
    }));

    return {
      statusCode: HttpStatus.OK,
      message: 'Get customer business vouchers successfully',
      data: enrichedData,
      total,
      currentPage,
      totalPages,
    };
  }

  // Get my redeemed voucher
  async getMyVouchers(
    userId: string,
    query: GetMyVouchersQueryDto,
  ): Promise<APIPaginatedResponseDto<any>> {
    const { page = 1, limit = 10 } = query;

    const filter = {
      redeemedBy: new Types.ObjectId(userId),
    };

    const populate = [
      {
        path: 'voucherId',
        model: 'BusinessVouchers',
        select:
          'customName customDescription discountPercent maxUsage redeemedCount startDate endDate',
      },
      {
        path: 'businessId',
        model: 'Businesses',
        select:
          'businessName businessAddress businessPhone openTime closeTime businessLogoUrl',
      },
    ];

    const { data, total, currentPage, totalPages } =
      await paginate<VoucherCodesDocument>(
        this.voucherCodeModel,
        filter,
        page,
        limit,
        undefined,
        undefined,
        populate,
      );

    return {
      statusCode: HttpStatus.OK,
      message: 'Get my vouchers successfully',
      data,
      total,
      currentPage,
      totalPages,
    };
  }
}
