// src/modules/eco-reward-policies/services/admin-eco-reward-policies.service.ts
import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  EcoRewardPolicy,
  EcoRewardPolicyDocument,
} from 'src/modules/eco-reward-policies/schemas/eco-reward-policy.schema';
import { CreateEcoRewardPolicyDto } from '../dto/admin-eco-policy/create-eco-reward-policy.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { GetEcoRewardPoliciesQueryDto } from '../dto/admin-eco-policy/get-eco-reward-policies-query.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { paginate } from 'src/common/utils/pagination.util';
import { UpdateEcoRewardPolicyDto } from '../dto/admin-eco-policy/update-eco-reward-policy.dto';

@Injectable()
export class AdminEcoRewardPoliciesService {
  constructor(
    @InjectModel(EcoRewardPolicy.name)
    private readonly policyModel: Model<EcoRewardPolicyDocument>,
  ) {}

  // ✅ Admin create eco policy
  async create(
    dto: CreateEcoRewardPolicyDto,
  ): Promise<APIResponseDto<EcoRewardPolicy>> {
    const trimmedLabel = dto.label.trim();

    const exists = await this.policyModel.findOne({
      threshold: dto.threshold,
    });

    if (exists) {
      throw new HttpException(
        `Threshold ${dto.threshold} already exists`,
        HttpStatus.CONFLICT,
      );
    }

    const created = await this.policyModel.create({
      ...dto,
      label: trimmedLabel,
      isActive: dto.isActive ?? true,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: `Created eco reward policy '${trimmedLabel}' successfully`,
      data: created,
    };
  }

  // ✅ Admin get all (with pagination + optional isActive filter)
  async getAll(
    query: GetEcoRewardPoliciesQueryDto,
  ): Promise<APIPaginatedResponseDto<EcoRewardPolicy[]>> {
    const { page = 1, limit = 10, isActive } = query;

    const filter: any = {};
    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
    }

    const { data, total, totalPages, currentPage } =
      await paginate<EcoRewardPolicyDocument>(
        this.policyModel,
        filter,
        page,
        limit,
      );

    return {
      statusCode: HttpStatus.OK,
      message: 'Get eco reward policies successfully',
      data,
      total,
      currentPage,
      totalPages,
    };
  }

  // ✅ Admin get detail
  async findOne(id: string): Promise<APIResponseDto<EcoRewardPolicy>> {
    const policy = await this.policyModel.findById(id);

    if (!policy) {
      throw new NotFoundException('Eco reward policy not found');
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Get eco reward policy successfully',
      data: policy,
    };
  }

  // ✅ Admin update
  async update(
    id: string,
    dto: UpdateEcoRewardPolicyDto,
  ): Promise<APIResponseDto<EcoRewardPolicy>> {
    const updated = await this.policyModel.findByIdAndUpdate(id, dto, {
      new: true,
    });

    if (!updated) {
      throw new NotFoundException('Eco reward policy not found');
    }

    return {
      statusCode: HttpStatus.OK,
      message: `Updated eco reward policy '${updated.label}' successfully`,
      data: updated,
    };
  }

  // ✅ Admin delete
  async remove(id: string): Promise<APIResponseDto<null>> {
    const deleted = await this.policyModel.findByIdAndDelete(id);

    if (!deleted) {
      throw new NotFoundException('Eco reward policy not found');
    }

    return {
      statusCode: HttpStatus.OK,
      message: `Deleted eco reward policy '${deleted.label}' successfully`,
      data: null,
    };
  }
}
