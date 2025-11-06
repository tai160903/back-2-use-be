import {
  Injectable,
  HttpStatus,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Material, MaterialDocument } from './schemas/material.schema';
import { GetMaterialsQueryDto } from './dto/get-materials-query.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { GetMyMaterialsQueryDto } from './dto/get-my-materials.dto';
import { paginate } from 'src/common/utils/pagination.util';
import { MaterialStatus } from 'src/common/constants/material-status.enum';
import {
  MaterialRequestDocument,
  MaterialRequests,
} from './schemas/material-requests.schema';
import {
  BusinessDocument,
  Businesses,
} from '../businesses/schemas/businesses.schema';

@Injectable()
export class MaterialService {
  constructor(
    @InjectModel(Material.name)
    private readonly materialModel: Model<MaterialDocument>,

    @InjectModel(MaterialRequests.name)
    private readonly materialRequestModel: Model<MaterialRequestDocument>,

    @InjectModel(Businesses.name)
    private readonly businessModel: Model<BusinessDocument>,
  ) {}

  // Business create material request
  async createMaterialRequest(
    createMaterialDto: CreateMaterialDto,
    userId: string,
  ): Promise<APIResponseDto<MaterialRequests>> {
    const { materialName, description } = createMaterialDto;

    const business = await this.businessModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!business) {
      throw new NotFoundException('Business not found for this user.');
    }

    const existingMaterial = await this.materialModel.findOne({
      materialName: { $regex: new RegExp(`^${materialName}$`, 'i') },
      isActive: true,
    });
    if (existingMaterial) {
      throw new ConflictException(
        `Material '${materialName}' already exists and has been approved.`,
      );
    }

    const existingPendingRequest = await this.materialRequestModel.findOne({
      businessId: business._id,
      requestedMaterialName: { $regex: new RegExp(`^${materialName}$`, 'i') },
      status: 'pending',
    });
    if (existingPendingRequest) {
      throw new ConflictException(
        `You already have a pending request for '${materialName}'.`,
      );
    }

    const newRequest = await this.materialRequestModel.create({
      businessId: business._id,
      requestedMaterialName: materialName.trim(),
      description: description?.trim() || '',
      status: 'pending',
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: `Material request '${materialName}' submitted successfully, awaiting admin approval.`,
      data: newRequest,
    };
  }

  // Business get active materials
  async getActiveMaterials(
    query: GetMaterialsQueryDto,
  ): Promise<APIPaginatedResponseDto<Material[]>> {
    const { page = 1, limit = 10 } = query;
    const filter = { isActive: true };

    const { data, total, currentPage, totalPages } =
      await paginate<MaterialDocument>(this.materialModel, filter, page, limit);

    return {
      statusCode: HttpStatus.OK,
      message: 'Get active materials successfully',
      data,
      total,
      currentPage,
      totalPages,
    };
  }

  // Business get all their material requests
  async getMyMaterialRequests(
    userId: string,
    query: GetMyMaterialsQueryDto,
  ): Promise<APIPaginatedResponseDto<MaterialRequests[]>> {
    const { status, page = 1, limit = 10 } = query;

    const business = await this.businessModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!business) {
      throw new NotFoundException('Business not found for this user.');
    }

    const filter: any = { businessId: business._id };
    if (status) {
      filter.status = status;
    }

    const { data, total, currentPage, totalPages } =
      await paginate<MaterialRequestDocument>(
        this.materialRequestModel,
        filter,
        page,
        limit,
        undefined,
        undefined,
        [
          {
            path: 'approvedMaterialId',
            select: 'materialName depositPercent reuseLimit',
          },
        ],
      );

    return {
      statusCode: HttpStatus.OK,
      message: 'Fetched your material requests successfully',
      data,
      total,
      currentPage,
      totalPages,
    };
  }
}
