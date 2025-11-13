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
import { GetAllVouchersQueryDto } from '../admin/dto/admin-voucher/get-all-vouchers.dto';
import { GetAllActiveVouchersQueryDto } from './dto/get-all-active-voucher.dto';
import { paginate } from 'src/common/utils/pagination.util';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import {
  BusinessVoucherDocument,
  BusinessVouchers,
} from '../businesses/schemas/business-voucher.schema';
import { VoucherCodeType } from 'src/common/constants/voucher-codes-types.enum';

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
    const { voucherId, voucherType } = redeemVoucherDto;
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const now = new Date();

      // 1️⃣ Lấy voucher theo loại
      let voucher;
      if (voucherType === VoucherCodeType.BUSINESS) {
        voucher = await this.businessVoucherModel
          .findById(voucherId)
          .session(session);
      } else {
        voucher = await this.voucherModel.findById(voucherId).session(session);
      }

      if (!voucher) throw new NotFoundException('Voucher not found');
      if (voucher.isPublished !== true)
        throw new BadRequestException('Voucher is not published');
      if (voucher.status !== VouchersStatus.ACTIVE)
        throw new BadRequestException('Voucher is not active');
      if (voucher.endDate < now)
        throw new BadRequestException('Voucher has expired');
      if (voucher.redeemedCount >= voucher.maxUsage)
        throw new BadRequestException('Voucher has reached max usage');

      // 2️⃣ Lấy customer
      const customer = await this.customerModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .session(session);
      if (!customer) throw new NotFoundException('Customer not found');

      // 3️⃣ Kiểm tra đã redeem voucher này chưa
      const existingCode = await this.voucherCodeModel
        .findOne({
          voucherId: new Types.ObjectId(voucherId),
          redeemedBy: new Types.ObjectId(userId),
        })
        .session(session);

      if (existingCode) {
        throw new BadRequestException('You have already redeemed this voucher');
      }

      // 4️⃣ Kiểm tra điểm thưởng
      if (customer.rewardPoints < voucher.rewardPointCost)
        throw new BadRequestException('Not enough reward points');

      // 5️⃣ Trừ điểm
      customer.rewardPoints -= voucher.rewardPointCost;
      await customer.save({ session });

      // 6️⃣ Tạo voucher code (retry 3 lần nếu trùng mã)
      let voucherCode: VoucherCodesDocument | null = null;

      for (let i = 0; i < 3; i++) {
        const randomSuffix = generateRandomString(6);
        const fullCode = `${voucher.baseCode}-${randomSuffix}`;

        try {
          voucherCode = new this.voucherCodeModel({
            voucherId: voucher._id,
            voucherType,
            businessId: voucher.businessId ?? undefined,
            redeemedBy: new Types.ObjectId(userId),
            fullCode,
            status: VoucherCodeStatus.REDEEMED,
            redeemedAt: now,
          });

          await voucherCode.save({ session });
          break; // ✅ Thành công => thoát vòng lặp
        } catch (err) {
          if (err.code === 11000 && err.keyPattern?.fullCode) {
            // 🔁 Nếu trùng mã => thử lại
            continue;
          }
          throw err; // ❌ Lỗi khác => ném ra
        }
      }

      if (!voucherCode) {
        throw new InternalServerErrorException(
          'Failed to generate unique voucher code',
        );
      }

      // 7️⃣ Tăng redeemedCount
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

  // //Get all active voucher
  // async getAllActiveVouchers(
  //   query: GetAllActiveVouchersQueryDto,
  // ): Promise<APIPaginatedResponseDto<Vouchers[]>> {
  //   const { page = 1, limit = 10 } = query;

  //   const now = new Date();
  //   const filter = {
  //     status: VouchersStatus.ACTIVE,
  //     startDate: { $lte: now },
  //     endDate: { $gte: now },
  //   };

  //   const { data, total, currentPage, totalPages } =
  //     await paginate<VouchersDocument>(this.voucherModel, filter, page, limit);

  //   return {
  //     statusCode: HttpStatus.OK,
  //     message: 'Get active vouchers successfully',
  //     data,
  //     total,
  //     currentPage,
  //     totalPages,
  //   };
  // }
}
