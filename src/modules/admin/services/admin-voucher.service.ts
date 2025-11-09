import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import {
  Vouchers,
  VouchersDocument,
} from 'src/modules/vouchers/schema/vouchers.schema';
import { CreateSystemVoucherDto } from '../dto/admin-voucher/create-voucher/create-system-voucher.dto';
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
import { VoucherType } from 'src/common/constants/voucher-types.enum';
import { CreateBusinessVoucherDto } from '../dto/admin-voucher/create-voucher/create-business-voucher.dto';
import { CreateLeaderboardVoucherDto } from '../dto/admin-voucher/create-voucher/create-leaderboard-voucher.dto';
import { CreateVoucherUnion } from '../dto/admin-voucher/create-voucher/create-voucher-union';
import {
  EcoRewardPolicy,
  EcoRewardPolicyDocument,
} from 'src/modules/eco-reward-policies/schemas/eco-reward-policy.schema';
import { getAllowedVoucherUpdateFields } from 'src/common/helpers/voucher.helper';
import { UpdateVoucherDto } from '../dto/admin-voucher/update-voucher.dto';

@Injectable()
export class AdminVoucherService {
  constructor(
    @InjectModel(Vouchers.name)
    private readonly voucherModel: Model<VouchersDocument>,

    @InjectModel(VoucherCodes.name)
    private readonly voucherCodeModel: Model<VoucherCodesDocument>,

    @InjectModel(EcoRewardPolicy.name)
    private readonly ecoRewardPolicyModel: Model<EcoRewardPolicyDocument>,
  ) {}

  // Admin create voucher
  async createVoucher(
    createVoucherDto: CreateVoucherUnion,
  ): Promise<APIResponseDto<Vouchers>> {
    const { voucherType } = createVoucherDto;
    const now = new Date();

    let start: Date | undefined;
    let end: Date | undefined;

    // --- VOUCHER TYPE: SYSTEM hoặc LEADERBOARD ---
    if (voucherType === VoucherType.SYSTEM) {
      const dto = createVoucherDto as CreateSystemVoucherDto;

      start = dto.startDate ? new Date(dto.startDate) : now;
      end = dto.endDate ? new Date(dto.endDate) : undefined;

      if (!end || isNaN(end.getTime())) {
        throw new BadRequestException(
          'endDate is required and must be a valid date.',
        );
      }

      if (isNaN(start.getTime())) {
        throw new BadRequestException('Invalid startDate format.');
      }

      if (end <= start) {
        throw new BadRequestException('endDate must be later than startDate.');
      }

      if (dto.startDate && start < now) {
        throw new BadRequestException('startDate cannot be in the past.');
      }

      // Validate rewardPointCost (only SYSTEM)
      if (voucherType === VoucherType.SYSTEM) {
        const rewardPointCost = (dto as CreateSystemVoucherDto).rewardPointCost;
        if (rewardPointCost === undefined || rewardPointCost < 0) {
          throw new BadRequestException(
            'rewardPointCost is required and must be >= 0 for system vouchers.',
          );
        }
      }
    }

    // --- VOUCHER TYPE: BUSINESS ---
    else if (voucherType === VoucherType.BUSINESS) {
      const dto = createVoucherDto as CreateBusinessVoucherDto;

      start = undefined;
      end = undefined;

      // Validate ecoRewardPolicyId
      if (dto.ecoRewardPolicyId) {
        const ecoPolicy = await this.ecoRewardPolicyModel.findById(
          dto.ecoRewardPolicyId,
        );
        if (!ecoPolicy) {
          throw new BadRequestException(
            `EcoRewardPolicy '${dto.ecoRewardPolicyId}' not found.`,
          );
        }
      }
    }

    // --- VOUCHER TYPE: LEADERBOARD ---
    else if (voucherType === VoucherType.LEADERBOARD) {
      const dto = createVoucherDto as CreateLeaderboardVoucherDto;

      start = undefined;
      end = undefined;
    }

    // --- VOUCHER TYPE KHÁC ---
    else {
      throw new BadRequestException(
        `Unsupported voucher type '${voucherType}'.`,
      );
    }

    // Determine status
    const status =
      voucherType === VoucherType.BUSINESS ||
      voucherType === VoucherType.LEADERBOARD
        ? VouchersStatus.TEMPLATE
        : start && start > now
          ? VouchersStatus.INACTIVE
          : VouchersStatus.ACTIVE;

    // Create voucher
    const newVoucher = new this.voucherModel({
      ...createVoucherDto,
      ecoRewardPolicyId:
        voucherType === VoucherType.BUSINESS &&
        (createVoucherDto as CreateBusinessVoucherDto).ecoRewardPolicyId
          ? new Types.ObjectId(
              (createVoucherDto as CreateBusinessVoucherDto).ecoRewardPolicyId,
            )
          : undefined,
      startDate: start,
      endDate: end,
      status,
    });

    const savedVoucher = await newVoucher.save();

    return {
      statusCode: HttpStatus.CREATED,
      message: `Create voucher '${savedVoucher.name}' successfully.`,
      data: savedVoucher,
    };
  }

  // Get all vouchers
  async getAllVoucher(
    query: GetAllVouchersQueryDto,
  ): Promise<APIPaginatedResponseDto<Vouchers[]>> {
    const { status, voucherType, page = 1, limit = 10 } = query;

    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (voucherType) filter.voucherType = voucherType;

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

  // Get voucher by id
  async getVoucherById(id: string): Promise<APIResponseDto<Vouchers>> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid voucher ID '${id}'.`);
    }

    const voucher = await this.voucherModel
      .findById(id)
      .populate({
        path: 'ecoRewardPolicyId',
        select: 'threshold label description isActive',
      })
      .exec();

    if (!voucher) {
      throw new NotFoundException(`Voucher with id '${id}' not found.`);
    }

    return {
      statusCode: HttpStatus.OK,
      message: `Get voucher '${voucher.name}' successfully.`,
      data: voucher,
    };
  }

  // Admin update voucher
  // async updateVoucher(
  //   id: string,
  //   updateDto: UpdateVoucherDto,
  // ): Promise<APIResponseDto<Vouchers>> {
  //   // 1️⃣ Kiểm tra voucher tồn tại
  //   const voucher = await this.voucherModel.findById(id);
  //   if (!voucher) {
  //     throw new NotFoundException(`Voucher '${id}' not found.`);
  //   }

  //   // 2️⃣ Lấy danh sách field được phép cập nhật từ helper
  //   const allowedFields = getAllowedVoucherUpdateFields(voucher);

  //   // 3️⃣ Nếu không có field nào được phép update → báo lỗi
  //   if (allowedFields.length === 0) {
  //     throw new BadRequestException(
  //       `Vouchers of type '${voucher.voucherType}' with status '${voucher.status}' cannot be updated.`,
  //     );
  //   }

  //   // 4️⃣ Loại bỏ các field không hợp lệ khỏi DTO
  //   Object.keys(updateDto).forEach((key) => {
  //     if (!allowedFields.includes(key)) delete updateDto[key];
  //   });

  //   // Nếu không còn field nào sau khi lọc → báo lỗi
  //   if (Object.keys(updateDto).length === 0) {
  //     throw new BadRequestException(
  //       `No valid fields to update for voucher '${voucher.name}'.`,
  //     );
  //   }

  //   // 5️⃣ Cập nhật và lưu
  //   Object.assign(voucher, updateDto);
  //   const updated = await voucher.save();

  //   return {
  //     statusCode: HttpStatus.OK,
  //     message: `Updated voucher '${updated.name}' successfully.`,
  //     data: updated,
  //   };
  // }
}
