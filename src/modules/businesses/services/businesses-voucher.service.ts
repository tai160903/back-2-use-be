import { Model, Types } from 'mongoose';
import {
  Injectable,
  Inject,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
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
import { GetVouchersQueryDto } from '../dto/get-vouchers-query.dto';
import { GetAllClaimVouchersQueryDto } from '../dto/get-all-claim-voucher.dto';
import { SetupBusinessVoucherDto } from '../dto/setup-business-voucher.dto';
import { UpdateBusinessVoucherDto } from '../dto/update-business-voucher.dto';
import {
  VoucherCodes,
  VoucherCodesDocument,
} from 'src/modules/voucher-codes/schema/voucher-codes.schema';
import { VoucherCodeStatus } from 'src/common/constants/voucher-codes-status.enum';
import { UseVoucherAtStoreDto } from '../dto/use-voucher-at-store';
import { GetVoucherDetailQueryDto } from '../dto/get-voucher-detail.dto';
import { BusinessCreateVoucherDto } from '../dto/business-create-voucher';
import { Staff, StaffDocument } from 'src/modules/staffs/schemas/staffs.schema';
import {
  Customers,
  CustomersDocument,
} from 'src/modules/users/schemas/customer.schema';
import { RolesEnum } from 'src/common/constants/roles.enum';

@Injectable()
export class BusinessVoucherService {
  constructor(
    @InjectModel(BusinessVouchers.name)
    private readonly businessVoucherModel: Model<BusinessVoucherDocument>,

    @InjectModel(Vouchers.name)
    private readonly voucherModel: Model<VouchersDocument>,

    @InjectModel(VoucherCodes.name)
    private readonly voucherCodeModel: Model<VoucherCodesDocument>,

    @InjectModel(Businesses.name)
    private readonly businessModel: Model<BusinessDocument>,

    @InjectModel(EcoRewardPolicy.name)
    private readonly ecoRewardPolicyModel: Model<EcoRewardPolicyDocument>,

    @InjectModel(Staff.name)
    private readonly staffModel: Model<StaffDocument>,

    @InjectModel(Customers.name)
    private readonly customerModel: Model<CustomersDocument>,
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

    // Lấy tất cả policies để xác định tier hiện tại
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
      voucherType: VoucherType.BUSINESS,
      isPublished: false,
      isSetup: false,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: `Business '${business.businessName}' claimed voucher '${template.name}' successfully.`,
      data: businessVoucher,
    };
  }

  // Business setup voucher after claim
  async setupClaimedVoucher(
    userId: string,
    businessVoucherId: string,
    dto: SetupBusinessVoucherDto,
  ): Promise<APIResponseDto<BusinessVouchers>> {
    const {
      startDate,
      endDate,
      discountPercent,
      rewardPointCost,
      isPublished,
    } = dto;

    const business = await this.businessModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!business) {
      throw new NotFoundException(`No business found for user '${userId}'.`);
    }

    const businessVoucher =
      await this.businessVoucherModel.findById(businessVoucherId);

    if (!businessVoucher) {
      throw new NotFoundException(
        `Business voucher '${businessVoucherId}' not found.`,
      );
    }

    // Check ownership
    if (businessVoucher.businessId.toString() !== business._id.toString()) {
      throw new ForbiddenException(`You are not allowed to edit this voucher.`);
    }

    // Không cho setup nếu đã setup trước đó
    if (businessVoucher.isSetup) {
      throw new BadRequestException(`This voucher has already been set up.`);
    }

    // Không cho setup nếu đã publish
    if (businessVoucher.isPublished) {
      throw new BadRequestException(`Cannot setup a published voucher.`);
    }

    // --- Validate bắt buộc đủ field ---
    if (!endDate) {
      throw new BadRequestException(`endDate is required.`);
    }

    if (
      typeof discountPercent !== 'number' ||
      typeof rewardPointCost !== 'number'
    ) {
      throw new BadRequestException(
        `discountPercent and rewardPointCost are required and must be numbers.`,
      );
    }

    const now = new Date();
    const start = startDate ? new Date(startDate) : now;
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException(`Invalid date format.`);
    }

    if (startDate && start < now) {
      throw new BadRequestException(`startDate cannot be in the past.`);
    }

    if (end <= start) {
      throw new BadRequestException(`endDate must be later than startDate.`);
    }

    // --- Determine new status ---
    let status: VouchersStatus;
    if (now < start) status = VouchersStatus.INACTIVE;
    else if (now >= start && now <= end) status = VouchersStatus.ACTIVE;
    else status = VouchersStatus.EXPIRED;

    // --- Update and mark as setup ---
    businessVoucher.discountPercent = discountPercent;
    businessVoucher.rewardPointCost = rewardPointCost;
    businessVoucher.startDate = start;
    businessVoucher.endDate = end;
    businessVoucher.status = status;
    businessVoucher.isSetup = true;
    businessVoucher.isPublished = !!isPublished;

    await businessVoucher.save();

    return {
      statusCode: HttpStatus.OK,
      message: `Voucher '${businessVoucher.customName}' setup successfully.`,
      data: businessVoucher,
    };
  }

  async createBusinessVoucher(
    userId: string,
    dto: BusinessCreateVoucherDto,
  ): Promise<APIResponseDto<BusinessVouchers>> {
    const {
      customName,
      customDescription,
      baseCode,
      maxUsage,
      discountPercent,
      rewardPointCost,
      isPublished,
      startDate,
      endDate,
    } = dto;

    // 1️⃣ Lấy business của user
    const business = await this.businessModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!business) {
      throw new NotFoundException(`No business found for user '${userId}'.`);
    }

    // 2️⃣ Validate ngày tháng
    const now = new Date();

    // Nếu không truyền startDate → auto = now
    const start = startDate ? new Date(startDate) : now;

    if (isNaN(start.getTime())) {
      throw new BadRequestException(`Invalid startDate format.`);
    }

    // endDate bắt buộc
    if (!endDate) {
      throw new BadRequestException(`endDate is required.`);
    }

    const end = new Date(endDate);

    if (isNaN(end.getTime())) {
      throw new BadRequestException(`Invalid endDate format.`);
    }

    if (end <= start) {
      throw new BadRequestException(`endDate must be later than startDate.`);
    }

    // Nếu start là do user truyền → validate không được trước hiện tại
    if (startDate && start < now) {
      throw new BadRequestException(`startDate cannot be in the past.`);
    }

    //  Xác định status
    let status: VouchersStatus;
    if (now < start) status = VouchersStatus.INACTIVE;
    else if (now >= start && now <= end) status = VouchersStatus.ACTIVE;
    else status = VouchersStatus.EXPIRED;

    const businessVoucher = await this.businessVoucherModel.create({
      businessId: business._id,

      customName,
      customDescription,

      baseCode,
      maxUsage,
      discountPercent,
      rewardPointCost,
      startDate: start,
      endDate: end,

      voucherType: VoucherType.BUSINESS,
      status,
      redeemedCount: 0,
      isPublished: isPublished ?? true,
      isSetup: true,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: `Business voucher '${businessVoucher.customName}' created successfully.`,
      data: businessVoucher,
    };
  }

  // Update voucher after setup
  async updateMyVoucher(
    userId: string,
    voucherId: string,
    dto: UpdateBusinessVoucherDto,
  ): Promise<APIResponseDto<BusinessVouchers>> {
    const business = await this.businessModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!business) {
      throw new NotFoundException(`No business found for user '${userId}'.`);
    }

    const businessVoucher = await this.businessVoucherModel.findById(voucherId);

    if (!businessVoucher) {
      throw new NotFoundException(`Voucher '${voucherId}' not found.`);
    }

    // --- Check ownership ---
    if (businessVoucher.businessId.toString() !== business._id.toString()) {
      throw new ForbiddenException(`You are not allowed to edit this voucher.`);
    }

    if (!businessVoucher.isSetup) {
      throw new BadRequestException(`Voucher has not been set up yet.`);
    }

    if (businessVoucher.status !== VouchersStatus.INACTIVE) {
      throw new BadRequestException(
        `Only inactive vouchers can be updated. Current status: '${businessVoucher.status}'.`,
      );
    }

    // --- Allow updating allowed fields ---
    const allowedFields = [
      'customName',
      'customDescription',
      'discountPercent',
      'rewardPointCost',
      'startDate',
      'endDate',
      'isPublished',
    ];

    for (const field of allowedFields) {
      if (dto[field] !== undefined) {
        (businessVoucher as any)[field] = dto[field];
      }
    }

    // --- Validate time consistency ---
    const now = new Date();
    const start = dto.startDate
      ? new Date(dto.startDate)
      : businessVoucher.startDate;
    const end = dto.endDate ? new Date(dto.endDate) : businessVoucher.endDate;

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException(`Invalid date format.`);
    }

    if (dto.startDate && start < now) {
      throw new BadRequestException(`startDate cannot be in the past.`);
    }

    if (end <= start) {
      throw new BadRequestException(`endDate must be later than startDate.`);
    }

    // --- Recalculate status ---
    if (now < start) businessVoucher.status = VouchersStatus.INACTIVE;
    else if (now >= start && now <= end)
      businessVoucher.status = VouchersStatus.ACTIVE;
    else businessVoucher.status = VouchersStatus.EXPIRED;

    await businessVoucher.save();

    return {
      statusCode: HttpStatus.OK,
      message: `Voucher '${businessVoucher.customName}' updated successfully.`,
      data: businessVoucher,
    };
  }

  // Business check customer's voucher at store
  async useVoucherAtStore(
    userId: string,
    role: string,
    dto: UseVoucherAtStoreDto,
  ): Promise<APIResponseDto<VoucherCodes>> {
    const { code } = dto;

    let business;

    //  Role Staff
    if (role === RolesEnum.STAFF) {
      const staff = await this.staffModel.findOne({
        userId: new Types.ObjectId(userId),
        status: 'active',
      });

      if (!staff) {
        throw new BadRequestException('Staff not found.');
      }

      business = await this.businessModel.findById(staff.businessId);
      if (!business) {
        throw new NotFoundException('Business not found for this staff.');
      }

      userId = business.userId.toString();
    }

    //  Role Business
    if (role === RolesEnum.BUSINESS) {
      business = await this.businessModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!business) {
        throw new NotFoundException(`No business found for user '${userId}'.`);
      }
    }

    if (!business) {
      throw new ForbiddenException('User cannot act on any business.');
    }

    const businessId = business._id.toString();

    // 2. Tìm voucher code
    const voucherCode = await this.voucherCodeModel.findOne({ fullCode: code });

    if (!voucherCode) throw new NotFoundException('Invalid voucher code');

    // 3. Nếu là LEADERBOARD → không check businessId
    if (voucherCode.voucherType === VoucherType.LEADERBOARD) {
      // Check trạng thái hợp lệ
      if (voucherCode.status === VoucherCodeStatus.USED)
        throw new BadRequestException('Voucher already used');

      if (voucherCode.status === VoucherCodeStatus.EXPIRED)
        throw new BadRequestException('Voucher expired');

      // Check expiry riêng của leaderboard (leaderboardExpireAt)
      if (
        voucherCode.leaderboardExpireAt &&
        voucherCode.leaderboardExpireAt < new Date()
      ) {
        throw new BadRequestException('Leaderboard voucher expired');
      }

      // Update
      const updated = await this.voucherCodeModel.findOneAndUpdate(
        { _id: voucherCode._id },
        {
          $set: {
            status: VoucherCodeStatus.USED,
            usedByBusinessId: business._id, // business nào cũng được
            usedAt: new Date(),
          },
        },
        { new: true },
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Leaderboard voucher used successfully',
        data: updated,
      };
    }

    // 4. BUSINESS voucher -> phải dùng đúng business
    if (voucherCode.voucherType !== VoucherType.BUSINESS)
      throw new BadRequestException('This voucher cannot be used at store');

    // Kiểm tra đúng business
    if (
      voucherCode.businessId &&
      voucherCode.businessId.toString() !== businessId
    ) {
      throw new ForbiddenException('This voucher belongs to another business');
    }

    if (voucherCode.status === VoucherCodeStatus.USED)
      throw new BadRequestException('Voucher already used');

    if (voucherCode.status === VoucherCodeStatus.EXPIRED)
      throw new BadRequestException('Voucher expired');

    // Update BUSINESS voucher
    const updated = await this.voucherCodeModel.findOneAndUpdate(
      { _id: voucherCode._id },
      {
        $set: {
          status: VoucherCodeStatus.USED,
          usedByBusinessId: business._id,
          usedAt: new Date(),
        },
      },
      { new: true },
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Voucher used successfully',
      data: updated,
    };
  }

  // Get all vouchers available for a business
  async getAllForBusiness(
    userId: string,
    query: GetVouchersQueryDto,
  ): Promise<APIPaginatedResponseDto<any>> {
    const { page = 1, limit = 10, tierLabel, minThreshold } = query;

    // 1️⃣ Lấy business
    const business = await this.businessModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!business) {
      throw new NotFoundException(`No business found for user '${userId}'.`);
    }

    // 2️⃣ Lấy toàn bộ eco reward policies
    const allPolicies = await this.ecoRewardPolicyModel
      .find({ isActive: true })
      .sort({ threshold: 1 });

    // 3️⃣ Xác định tier hiện tại của business
    const currentTier = getBusinessCurrentTier(business.ecoPoints, allPolicies);

    if (!currentTier) {
      throw new BadRequestException(
        `No active eco reward tier could be determined for business '${business.businessName}'.`,
      );
    }

    // 4️⃣ Lấy danh sách template voucher mà business đã claim
    const claimed = await this.businessVoucherModel.find({
      businessId: business._id,
    });

    const claimedTemplateIds = new Set(
      claimed.map((c) => c.templateVoucherId.toString()),
    );

    // 5️⃣ Filter voucher base
    const baseFilter: any = {
      voucherType: VoucherType.BUSINESS,
      isDisabled: false,
    };

    // 6️⃣ Pipeline chính
    const pipeline: any[] = [
      { $match: baseFilter },
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

    // 7️⃣ Filter theo tiers
    if (tierLabel) {
      pipeline.push({
        $match: { 'ecoRewardPolicy.label': tierLabel },
      });
    }

    if (minThreshold) {
      pipeline.push({
        $match: { 'ecoRewardPolicy.threshold': { $gte: minThreshold } },
      });
    }

    pipeline.push({ $sort: { createdAt: -1 } });

    // 8️⃣ Paginate
    pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

    // 9️⃣ Query data
    const data = await this.voucherModel.aggregate(pipeline);

    // 🔟 Count pipeline
    const countPipeline: any[] = [
      { $match: baseFilter },
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

    if (tierLabel) {
      countPipeline.push({ $match: { 'ecoRewardPolicy.label': tierLabel } });
    }

    if (minThreshold) {
      countPipeline.push({
        $match: { 'ecoRewardPolicy.threshold': { $gte: minThreshold } },
      });
    }

    countPipeline.push({ $count: 'total' });

    const countResult = await this.voucherModel.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // 🔟 Gắn isClaimable
    const enrichedData = data.map((v: any) => {
      const policy = v.ecoRewardPolicy;

      const isClaimable =
        policy &&
        business.ecoPoints >= policy.threshold &&
        policy.threshold >= currentTier.threshold &&
        !v.isDisabled &&
        !claimedTemplateIds.has(v._id.toString());

      return {
        ...v,
        isClaimable,
      };
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Get business vouchers successfully',
      data: enrichedData,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Business get all claimed voucher
  async getMyClaimedVouchers(
    userId: string,
    role: string,
    query: GetAllClaimVouchersQueryDto,
  ): Promise<APIPaginatedResponseDto<BusinessVouchers[]>> {
    const { page = 1, limit = 10, status, isPublished } = query;

    let business;

    if (role === RolesEnum.STAFF) {
      const staff = await this.staffModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!staff) {
        throw new BadRequestException('Staff not found');
      }

      business = await this.businessModel.findById(staff.businessId);

      if (!business) {
        throw new NotFoundException('Business not found for this staff');
      }

      userId = business.userId.toString();
    }

    if (role === RolesEnum.BUSINESS) {
      business = await this.businessModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!business) {
        throw new NotFoundException(`Business not found for user '${userId}'`);
      }
    }

    const filter: Record<string, any> = {
      businessId: business._id,
    };

    if (status) filter.status = status;
    if (typeof isPublished === 'boolean') filter.isPublished = isPublished;

    const result = await paginate<BusinessVoucherDocument>(
      this.businessVoucherModel,
      filter,
      page,
      limit,
      undefined,
      undefined,
      {
        path: 'templateVoucherId',
        populate: {
          path: 'ecoRewardPolicyId',
          select: 'label threshold',
        },
      },
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Get my claimed vouchers successfully',
      data: result.data,
      total: result.total,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
    };
  }

  // Get business voucher detail
  async getBusinessVoucherDetail(
    userId: string,
    role: string,
    businessVoucherId: string,
    query: GetVoucherDetailQueryDto,
  ): Promise<APIResponseDto<any>> {
    const { page = 1, limit = 10, status } = query;

    let business;

    if (role === RolesEnum.STAFF) {
      const staff = await this.staffModel.findOne({
        userId: new Types.ObjectId(userId),
        status: 'active',
      });

      if (!staff) {
        throw new BadRequestException('Staff not found.');
      }

      business = await this.businessModel.findById(staff.businessId);
      if (!business) {
        throw new NotFoundException('Business not found for this staff.');
      }

      userId = business.userId.toString();
    }

    if (role === RolesEnum.BUSINESS) {
      business = await this.businessModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!business) {
        throw new NotFoundException(`No business found for user '${userId}'.`);
      }
    }

    const businessVoucher = await this.businessVoucherModel.findOne({
      _id: businessVoucherId,
      businessId: business._id,
    });

    if (!businessVoucher) {
      throw new NotFoundException('Business voucher not found');
    }

    const filter: Record<string, any> = {
      voucherId: businessVoucher._id,
    };

    if (status) filter.status = status;

    const allCodes = await this.voucherCodeModel.find({
      voucherId: businessVoucher._id,
    });

    const stats = {
      total: allCodes.length,
      used: allCodes.filter((v) => v.status === 'used').length,
      redeemed: allCodes.filter((v) => v.status === 'redeemed').length,
      expired: allCodes.filter((v) => v.status === 'expired').length,
    };

    const [voucherCodes, total] = await Promise.all([
      this.voucherCodeModel
        .find(filter)
        .populate({
          path: 'redeemedBy',
          select: 'fullName phone address yob userId',
          populate: {
            path: 'userId',
            select: 'avatar',
          },
        })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),

      this.voucherCodeModel.countDocuments(filter),
    ]);

    return {
      statusCode: HttpStatus.OK,
      message: 'Get vouchers detail successfully',
      data: {
        voucher: businessVoucher,
        voucherCodes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats,
      },
    };
  }

  // Business get voucher code detail
  async getVoucherCodeDetail(
    voucherCodeId: string,
  ): Promise<APIResponseDto<VoucherCodes>> {
    // 1. Lấy voucher code gốc (không populate)
    const voucherCode = await this.voucherCodeModel.findById(voucherCodeId);

    if (!voucherCode) {
      throw new NotFoundException(`Voucher code '${voucherCodeId}' not found`);
    }

    // 2. Lấy info liên quan
    const [business, customer, voucher] = await Promise.all([
      this.businessModel
        .findById(voucherCode.businessId)
        .select(
          'businessMail businessName businessAddress businessPhone businessType openTime closeTime businessLogoUrl',
        ),

      this.customerModel
        .findById(voucherCode.redeemedBy)
        .select('fullName phone address yob')
        .populate({
          path: 'userId',
          select: 'avatar',
        }),

      this.businessVoucherModel
        .findById(voucherCode.voucherId)
        .select(
          'customName customDescription discountPercent baseCode rewardPointCost maxUsage redeemedCount startDate endDate status',
        ),
    ]);

    // 3. Build object mới với 3 field bạn muốn
    const result = {
      ...voucherCode.toObject(),
      // new fields
      businessInfo: business ?? null,
      customerInfo: customer ?? null,
      voucherInfo: voucher ?? null,
    };

    return {
      statusCode: HttpStatus.OK,
      message: 'Voucher code detail fetched successfully',
      data: result,
    };
  }
}
