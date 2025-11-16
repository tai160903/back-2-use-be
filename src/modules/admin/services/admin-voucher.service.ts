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
import { UpdateVoucherDto } from '../dto/admin-voucher/update-voucher.dto';
import {
  BusinessVoucherDocument,
  BusinessVouchers,
} from 'src/modules/businesses/schemas/business-voucher.schema';
import { GetBusinessVoucherByVoucherIdQueryDto } from '../dto/admin-voucher/get-business-voucher-from-vouchers-query.dto';
import { GetVoucherCodesByBusinessVoucherIdQueryDto } from '../dto/admin-voucher/get-voucher-codes-from-business-voucher-query.dto';

@Injectable()
export class AdminVoucherService {
  constructor(
    @InjectModel(Vouchers.name)
    private readonly voucherModel: Model<VouchersDocument>,

    @InjectModel(VoucherCodes.name)
    private readonly voucherCodeModel: Model<VoucherCodesDocument>,

    @InjectModel(BusinessVouchers.name)
    private readonly businessVoucherModel: Model<BusinessVouchers>,

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

    // --- VOUCHER TYPE: BUSINESS ---
    if (voucherType === VoucherType.BUSINESS) {
      const dto = createVoucherDto as CreateBusinessVoucherDto;

      start = undefined;
      end = undefined;

      // Validate EcoRewardPolicy ID
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

    // --- VOUCHER TYPE KHÁC (không hợp lệ) ---
    else {
      throw new BadRequestException(
        `Unsupported voucher type '${voucherType}'.`,
      );
    }

    // --- Create voucher ---
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
    const { voucherType, isDisabled, page = 1, limit = 10 } = query;

    const filter: Record<string, any> = {};

    if (voucherType) filter.voucherType = voucherType;
    if (typeof isDisabled === 'boolean') filter.isDisabled = isDisabled;

    const pipeline: any[] = [
      { $match: filter },
      {
        $lookup: {
          from: 'ecorewardpolicies',
          localField: 'ecoRewardPolicyId',
          foreignField: '_id',
          as: 'ecoRewardPolicy',
        },
      },
      {
        $unwind: {
          path: '$ecoRewardPolicy',
          preserveNullAndEmptyArrays: true,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const data = await this.voucherModel.aggregate(pipeline);

    const totalPipeline = [{ $match: filter }, { $count: 'total' }];
    const totalResult = await this.voucherModel.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    return {
      statusCode: HttpStatus.OK,
      message: 'Get vouchers successfully',
      data,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
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

  // Get business voucher by voucherId
  async getBusinessVoucherByVoucherId(
    voucherId: string,
    query: GetBusinessVoucherByVoucherIdQueryDto,
  ): Promise<APIPaginatedResponseDto<BusinessVouchers[]>> {
    const { page = 1, limit = 10, status, isPublished } = query;

    const template = await this.voucherModel.findById(voucherId);
    if (!template) {
      throw new NotFoundException('Voucher template not found');
    }

    const filter: any = {
      templateVoucherId: new Types.ObjectId(voucherId),
    };

    if (status) filter.status = status;
    if (typeof isPublished === 'boolean') filter.isPublished = isPublished;

    const result = await paginate(
      this.businessVoucherModel,
      filter,
      page,
      limit,
      undefined,
      undefined,
      [
        {
          path: 'businessId',
          select: 'businessName businessAddress businessPhone businessLogoUrl',
        },
      ],
    );

    return {
      statusCode: 200,
      message: 'Get business voucher successfully',
      data: result.data,
      total: result.total,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
    };
  }

  // Get voucherCode by business voucher id
  async getVoucherCodesByBusinessVoucherId(
    businessVoucherId: string,
    query: GetVoucherCodesByBusinessVoucherIdQueryDto,
  ): Promise<APIPaginatedResponseDto<VoucherCodes[]>> {
    const { page = 1, limit = 10, status } = query;

    const businessVoucher =
      await this.businessVoucherModel.findById(businessVoucherId);
    if (!businessVoucher) {
      throw new NotFoundException('Business voucher not found');
    }

    const filter: any = {
      voucherId: new Types.ObjectId(businessVoucherId),
    };

    if (status) filter.status = status;

    const result = await paginate(
      this.voucherCodeModel,
      filter,
      page,
      limit,
      undefined,
      { createdAt: -1 },
      [
        {
          path: 'redeemedBy',
          select: 'fullName phone',
        },
      ],
    );

    return {
      statusCode: 200,
      message: 'Get voucher codes successfully',
      data: result.data,
      total: result.total,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
    };
  }

  // Admin update isDisable of voucher
  async updateVoucherTypeBusiness(
    voucherId: string,
    dto: UpdateVoucherDto,
  ): Promise<APIResponseDto<Vouchers>> {
    if (!isValidObjectId(voucherId)) {
      throw new BadRequestException(`Invalid voucher ID '${voucherId}'.`);
    }

    const voucher = await this.voucherModel.findById(voucherId);

    if (!voucher) {
      throw new NotFoundException(`Voucher with id '${voucherId}' not found.`);
    }

    // ❗ Only allow updates for BUSINESS voucher type
    if (voucher.voucherType !== VoucherType.BUSINESS) {
      throw new BadRequestException(
        `Only vouchers with type BUSINESS can be updated. Current type: '${voucher.voucherType}'.`,
      );
    }

    voucher.isDisabled = dto.isDisabled;

    const saved = await voucher.save();

    return {
      statusCode: HttpStatus.OK,
      message: `Voucher '${saved.name}' updated successfully.`,
      data: saved,
    };
  }
}
