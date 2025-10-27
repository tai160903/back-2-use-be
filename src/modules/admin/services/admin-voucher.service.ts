import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Vouchers,
  VouchersDocument,
  VouchersStatus,
} from 'src/modules/vouchers/schema/vouchers.schema';
import { CreateVoucherDto } from '../dto/admin-voucher/create-voucher.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';

@Injectable()
export class AdminVoucherService {
  constructor(
    @InjectModel(Vouchers.name)
    private readonly voucherModel: Model<VouchersDocument>,
  ) {}

  async createVoucher(
    createVoucherDto: CreateVoucherDto,
    adminId: string,
  ): Promise<APIResponseDto<Vouchers>> {
    if (new Date(createVoucherDto.endDate) <= new Date()) {
      throw new BadRequestException('endDate must be later than current date');
    }

    const existingVoucher = await this.voucherModel.findOne({
      baseCode: createVoucherDto.baseCode,
    });
    if (existingVoucher) {
      throw new ConflictException(
        `Voucher baseCode '${createVoucherDto.baseCode}' already exists.`,
      );
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
}
