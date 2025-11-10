import { Model, Types } from 'mongoose';
import {
  Injectable,
  Inject,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { BusinessDocument, Businesses } from '../schemas/businesses.schema';
import {
  BusinessVoucherDocument,
  BusinessVouchers,
} from '../schemas/business-voucher.schema';
import {
  Vouchers,
  VouchersDocument,
} from 'src/modules/vouchers/schema/vouchers.schema';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { VouchersStatus } from 'src/common/constants/vouchers-status.enum';
import { VoucherType } from 'src/common/constants/voucher-types.enum';
import {
  EcoRewardPolicy,
  EcoRewardPolicyDocument,
} from 'src/modules/eco-reward-policies/schemas/eco-reward-policy.schema';
import { getBusinessCurrentTier } from 'src/common/helpers/eco-reward.helper';
import { ClaimVoucherDto } from '../dto/claim-voucher.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { paginate } from 'src/common/utils/pagination.util';
import {
  GetVouchersQueryDto,
  VoucherTypeFilter,
} from '../dto/get-vouchers-query.dto';

@Injectable()
export class BusinessVoucherService {
  constructor(
    @InjectModel(BusinessVouchers.name)
    private readonly businessVoucherModel: Model<BusinessVoucherDocument>,

    @InjectModel(Vouchers.name)
    private readonly voucherModel: Model<VouchersDocument>,

    @InjectModel(Businesses.name)
    private readonly businessModel: Model<BusinessDocument>,

    @InjectModel(EcoRewardPolicy.name)
    private readonly ecoRewardPolicyModel: Model<EcoRewardPolicyDocument>,
  ) {}

  // Business claim voucher
  async claimVoucher(
    userId: string,
    voucherId: string,
    dto: ClaimVoucherDto,
  ): Promise<APIResponseDto<BusinessVouchers>> {
    const business = await this.businessModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!business) {
      throw new NotFoundException(`No business found for user '${userId}'.`);
    }

    // 2️⃣ Lấy voucher + ecoRewardPolicy
    const template = await this.voucherModel
      .findById(voucherId)
      .populate('ecoRewardPolicyId');

    if (!template) {
      throw new NotFoundException(`Voucher template '${voucherId}' not found.`);
    }

    if (template.isDisabled) {
      throw new BadRequestException(`Voucher '${template.name}' is disabled.`);
    }

    if (template.voucherType !== VoucherType.BUSINESS) {
      throw new BadRequestException(
        `Voucher '${template.name}' is not claimable by business.`,
      );
    }

    if (template.status !== VouchersStatus.TEMPLATE) {
      throw new BadRequestException(
        `Voucher '${template.name}' is not claimable (status: ${template.status}).`,
      );
    }

    // 3️⃣ Check đã claim chưa
    const existingClaim = await this.businessVoucherModel.findOne({
      templateVoucherId: template._id,
      businessId: business._id,
    });
    if (existingClaim) {
      throw new BadRequestException(
        `Business '${business.businessName}' has already claimed this voucher.`,
      );
    }

    // 4️⃣ Check policy
    const rewardPolicy = template.ecoRewardPolicyId as any;
    if (!rewardPolicy) {
      throw new BadRequestException(
        `Voucher '${template.name}' has no ecoRewardPolicy.`,
      );
    }

    // 🧠 Lấy tất cả policies để xác định tier hiện tại
    const allPolicies = await this.ecoRewardPolicyModel
      .find({ isActive: true })
      .sort({ threshold: 1 });

    const currentTier = getBusinessCurrentTier(business.ecoPoints, allPolicies);

    // Nếu không tìm thấy tier hiện tại (do chưa có policy nào)
    if (!currentTier) {
      throw new BadRequestException(
        `No active eco reward tier could be determined for business '${business.businessName}'.`,
      );
    }

    // Nếu chưa đủ điểm cho tier của voucher
    if (business.ecoPoints < rewardPolicy.threshold) {
      throw new BadRequestException(
        `Not enough ecoPoints to claim this voucher. Required: ${rewardPolicy.threshold}, you have: ${business.ecoPoints}.`,
      );
    }

    // Nếu voucher tier thấp hơn tier hiện tại → từ chối
    if (rewardPolicy.threshold < currentTier.threshold) {
      throw new BadRequestException(
        `Your current tier '${currentTier.label}' cannot claim lower-tier vouchers ('${rewardPolicy.label}').`,
      );
    }

    // 5️⃣ Tạo businessVoucher
    const businessVoucher = await this.businessVoucherModel.create({
      templateVoucherId: template._id,
      businessId: business._id,
      customName: dto?.customName || template.name,
      customDescription: dto?.customDescription || template.description,
      baseCode: template.baseCode,
      maxUsage: template.maxUsage,
      status: VouchersStatus.CLAIMED,
      isPublished: false,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: `Business '${business.businessName}' claimed voucher '${template.name}' successfully.`,
      data: businessVoucher,
    };
  }

  // Get all vouchers available for a business
  async getAllForBusiness(
    userId: string,
    query: GetVouchersQueryDto,
  ): Promise<APIPaginatedResponseDto<any>> {
    const {
      page = 1,
      limit = 10,
      voucherType,
      tierLabel,
      minThreshold,
    } = query;

    // 🔹 Lấy business theo user
    const business = await this.businessModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!business) {
      throw new NotFoundException(`No business found for user '${userId}'.`);
    }

    // 🔹 Các loại voucher được phép
    const allowedTypes = [VoucherType.SYSTEM, VoucherType.BUSINESS];
    const filter: any = {
      isDisabled: false,
      voucherType: voucherType ? { $in: [voucherType] } : { $in: allowedTypes },
    };

    // 🔹 Nếu lọc system vouchers → chỉ lấy ACTIVE
    if (voucherType === VoucherTypeFilter.SYSTEM) {
      filter.status = VouchersStatus.ACTIVE;
    }

    // 🔹 Nếu lọc business vouchers → chỉ lấy TEMPLATE
    else if (voucherType === VoucherTypeFilter.BUSINESS) {
      filter.status = VouchersStatus.TEMPLATE;

      // Nếu có lọc theo tier hoặc threshold → join sang ecoRewardPolicy
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
        { $unwind: '$ecoRewardPolicy' },
      ];

      // Thêm filter theo tierLabel
      if (tierLabel) {
        pipeline.push({
          $match: { 'ecoRewardPolicy.label': tierLabel },
        });
      }

      // Hoặc filter theo threshold
      if (minThreshold) {
        pipeline.push({
          $match: { 'ecoRewardPolicy.threshold': { $gte: minThreshold } },
        });
      }

      // Phân trang
      pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

      const data = await this.voucherModel.aggregate(pipeline);
      const total = await this.voucherModel.aggregate([
        ...pipeline.slice(0, -2),
        { $count: 'total' },
      ]);

      return {
        statusCode: HttpStatus.OK,
        message: 'Get business vouchers successfully',
        data,
        total: total[0]?.total || 0,
        currentPage: page,
        totalPages: Math.ceil((total[0]?.total || 0) / limit),
      };
    }

    // 🔹 Nếu không truyền voucherType → lấy cả 2 loại
    else {
      filter.$or = [
        { voucherType: VoucherType.SYSTEM, status: VouchersStatus.ACTIVE },
        { voucherType: VoucherType.BUSINESS, status: VouchersStatus.TEMPLATE },
      ];
      delete filter.voucherType;
    }

    // 🔹 Mặc định paginate cho system hoặc combined
    const { data, total, currentPage, totalPages } =
      await paginate<VouchersDocument>(this.voucherModel, filter, page, limit);

    return {
      statusCode: HttpStatus.OK,
      message: 'Get business vouchers successfully',
      data,
      total,
      currentPage,
      totalPages,
    };
  }
}
