import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Vouchers,
  VouchersDocument,
} from 'src/modules/vouchers/schema/vouchers.schema';
import { CreateVoucherDto } from '../dto/admin-voucher/create-voucher.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { VouchersStatus } from 'src/common/constants/vouchers-status.enum';
import { GetAllVouchersQueryDto } from '../dto/admin-voucher/get-all-vouchers.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { paginate } from 'src/common/utils/pagination.util';
import { VoucherCodeStatus } from 'src/common/constants/voucher-codes-status.enum';
import {
  VoucherCodes,
  VoucherCodesDocument,
} from 'src/modules/voucher-codes/schema/voucher-codes.schema';
import { GetVoucherCodesQueryDto } from '../dto/admin-voucher/get-voucher-codes-query.dto';

@Injectable()
export class AdminVoucherService {
  constructor(
    @InjectModel(Vouchers.name)
    private readonly voucherModel: Model<VouchersDocument>,

    @InjectModel(VoucherCodes.name)
    private readonly voucherCodeModel: Model<VoucherCodesDocument>,
  ) {}

  // Admin create voucher
  async createVoucher(
    createVoucherDto: CreateVoucherDto,
    adminId: string,
  ): Promise<APIResponseDto<Vouchers>> {
    if (new Date(createVoucherDto.endDate) <= new Date()) {
      throw new BadRequestException('endDate must be later than current date');
    }

    const newVoucher = new this.voucherModel({
      ...createVoucherDto,
      createdBy: adminId,
      status: VouchersStatus.ACTIVE,
    });

    const savedVoucher = await newVoucher.save();

    return {
      statusCode: HttpStatus.CREATED,
      message: `Create voucher '${createVoucherDto.name}' successfully.`,
      data: savedVoucher,
    };
  }

  // Admin get all voucher
  async getAllVoucher(
    query: GetAllVouchersQueryDto,
  ): Promise<APIPaginatedResponseDto<Vouchers[]>> {
    const { status, page = 1, limit = 10 } = query;
    const filter = status ? { status } : {};

    const { data, total, currentPage, totalPages } =
      await paginate<VouchersDocument>(this.voucherModel, filter, page, limit);

    return {
      statusCode: HttpStatus.OK,
      message: 'Get vouchers successfully',
      data,
      total,
      currentPage,
      totalPages,
    };
  }

  // Get voucher codes
  async getVoucherCodes(
    voucherId: string,
    query: GetVoucherCodesQueryDto,
  ): Promise<APIPaginatedResponseDto<VoucherCodes[]>> {
    const { page, limit, status } = query;

    if (!Types.ObjectId.isValid(voucherId)) {
      throw new BadRequestException('Invalid voucher ID');
    }

    const voucherExists = await this.voucherModel.exists({
      _id: new Types.ObjectId(voucherId),
    });

    if (!voucherExists) {
      throw new NotFoundException('Voucher not found');
    }

    const filter: any = { voucherId: new Types.ObjectId(voucherId) };
    if (status) {
      filter.status = status;
    }

    const { data, total, currentPage, totalPages } =
      await paginate<VoucherCodesDocument>(
        this.voucherCodeModel,
        filter,
        page,
        limit,
      );

    const populatedData = await this.voucherCodeModel.populate(data, {
      path: 'redeemedBy',
      select: 'username email',
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Get voucher codes successfully',
      data: populatedData,
      total,
      currentPage,
      totalPages,
    };
  }
}
