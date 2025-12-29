import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';

import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import {
  Material,
  MaterialDocument,
} from 'src/modules/materials/schemas/material.schema';
import { CreateMaterialDto } from 'src/modules/materials/dto/create-material.dto';
import { GetMaterialsQueryDto } from 'src/modules/materials/dto/get-materials-query.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { UpdateMaterialDto } from 'src/modules/materials/dto/update-material.dto';
import {
  RequestDecision,
  ReviewMaterialRequestDto,
} from 'src/modules/materials/dto/review-material-request.dto';
import { paginate } from 'src/common/utils/pagination.util';
import { MaterialStatus } from 'src/common/constants/material-status.enum';
import { AdminCreateMaterialDto } from '../dto/admin-material/admin-create-material.dto';
import {
  MaterialRequestDocument,
  MaterialRequests,
} from 'src/modules/materials/schemas/material-requests.schema';
import { GetMaterialRequestsQueryDto } from 'src/modules/materials/dto/get-material-request.dtp';
import { MaterialRequestStatus } from 'src/common/constants/material-request-status.enum';

@Injectable()
export class AdminMaterialService {
  constructor(
    @InjectModel(Material.name)
    private readonly materialModel: Model<MaterialDocument>,

    @InjectModel(MaterialRequests.name)
    private readonly materialRequestModel: Model<MaterialRequestDocument>,
  ) {}

  // Admin create material
  async adminCreate(
    createMaterialDto: AdminCreateMaterialDto,
    adminId: string,
  ): Promise<APIResponseDto<Material>> {
    const { materialName, isSingleUse, reuseLimit } = createMaterialDto;
    const normalizedName = materialName.trim().toLowerCase();

    const existed = await this.materialModel.findOne({
      $expr: {
        $eq: [
          { $toLower: { $trim: { input: '$materialName' } } },
          normalizedName,
        ],
      },
    });

    if (existed) {
      throw new HttpException(
        'Material name already exists',
        HttpStatus.CONFLICT,
      );
    }

    if (isSingleUse && reuseLimit > 1) {
      throw new HttpException(
        'Single-use material must have reuseLimit = 1',
        HttpStatus.BAD_REQUEST,
      );
    }

    const material = await this.materialModel.create({
      ...createMaterialDto,
      materialName: materialName.trim(),
      reuseLimit: isSingleUse ? 1 : reuseLimit,
      createdBy: new Types.ObjectId(adminId),
      isActive: true,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: `Create material '${material.materialName}' successfully`,
      data: material,
    };
  }

  // Admin get all materials (with pagination + optional filters)
  async get(
    query: GetMaterialsQueryDto,
  ): Promise<APIPaginatedResponseDto<Material[]>> {
    const { isActive, isSingleUse, page = 1, limit = 10 } = query;

    const filter: Record<string, any> = {};

    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
    }

    if (typeof isSingleUse === 'boolean') {
      filter.isSingleUse = isSingleUse;
    }

    const { data, total, currentPage, totalPages } =
      await paginate<MaterialDocument>(this.materialModel, filter, page, limit);

    return {
      statusCode: HttpStatus.OK,
      message: 'Get materials successfully',
      data,
      total,
      currentPage,
      totalPages,
    };
  }

  // Admin get all material request
  async getAllMaterialRequests(
    query: GetMaterialRequestsQueryDto,
  ): Promise<APIPaginatedResponseDto<MaterialRequests[]>> {
    const { status, page = 1, limit = 10 } = query;
    const filter = status ? { status } : {};

    const { data, total, currentPage, totalPages } =
      await paginate<MaterialRequestDocument>(
        this.materialRequestModel,
        filter,
        page,
        limit,
        undefined,
        { createdAt: -1 },
        {
          path: 'businessId',
          select: 'businessName',
        },
      );

    return {
      statusCode: HttpStatus.OK,
      message: 'Get material requests successfully',
      data,
      total,
      currentPage,
      totalPages,
    };
  }

  // Admin update material by ID
  async update(
    id: string,
    updateDto: UpdateMaterialDto,
  ): Promise<APIResponseDto<Material>> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid Material ID '${id}'`);
    }

    if (!updateDto || Object.keys(updateDto).length === 0) {
      throw new BadRequestException(
        'At least one field must be provided for update',
      );
    }

    const material = await this.materialModel.findById(id).exec();
    if (!material) {
      throw new NotFoundException('Material not found');
    }

    // -------------------- MATERIAL NAME --------------------
    if (updateDto.materialName) {
      const normalizedName = updateDto.materialName.trim();

      const existingMaterial = await this.materialModel.findOne({
        _id: { $ne: material._id },
        materialName: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
      });

      if (existingMaterial) {
        throw new ConflictException(
          `Material name '${normalizedName}' already exists`,
        );
      }

      updateDto.materialName = normalizedName;
    }

    // -------------------- SINGLE USE / REUSE LOGIC --------------------
    const finalIsSingleUse =
      typeof updateDto.isSingleUse === 'boolean'
        ? updateDto.isSingleUse
        : material.isSingleUse;

    const finalReuseLimit =
      typeof updateDto.reuseLimit === 'number'
        ? updateDto.reuseLimit
        : material.reuseLimit;

    if (finalIsSingleUse && finalReuseLimit !== 1) {
      throw new BadRequestException(
        'Single-use material must have reuseLimit = 1',
      );
    }

    if (!finalIsSingleUse && finalReuseLimit <= 1) {
      throw new BadRequestException(
        'Reusable material must have reuseLimit > 1',
      );
    }

    // -------------------- IS ACTIVE NO-OP CHECK --------------------
    if (
      typeof updateDto.isActive === 'boolean' &&
      updateDto.isActive === material.isActive
    ) {
      const stateText = material.isActive ? 'active' : 'inactive';
      return {
        statusCode: HttpStatus.OK,
        message: `Material is already ${stateText}`,
        data: material,
      };
    }

    // -------------------- APPLY UPDATE --------------------
    Object.assign(material, updateDto);
    const updatedMaterial = await material.save();

    return {
      statusCode: HttpStatus.OK,
      message: `Update material '${updatedMaterial.materialName}' successfully`,
      data: updatedMaterial,
    };
  }

  // Admin approve or reject material by ID
  async reviewMaterialRequest(
    id: string,
    dto: ReviewMaterialRequestDto,
  ): Promise<APIResponseDto<MaterialRequests>> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid request ID '${id}'`);
    }

    const request = await this.materialRequestModel.findById(id);
    if (!request) {
      throw new NotFoundException('Material request not found');
    }

    if (request.status !== MaterialRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be reviewed');
    }

    // -------------------- REJECT FLOW --------------------
    if (dto.decision === RequestDecision.REJECT) {
      if (!dto.adminNote) {
        throw new BadRequestException('adminNote is required when rejecting');
      }

      request.status = MaterialRequestStatus.REJECTED;
      request.adminNote = dto.adminNote;
      await request.save();

      return {
        statusCode: HttpStatus.OK,
        message: `Rejected request '${request.requestedMaterialName}' successfully.`,
        data: request,
      };
    }

    // -------------------- APPROVE FLOW --------------------
    const { isSingleUse, reuseLimit, co2EmissionPerKg } =
      dto.materialData || {};

    if (isSingleUse == null || reuseLimit == null || co2EmissionPerKg == null) {
      throw new BadRequestException(
        'isSingleUse, reuseLimit, and co2EmissionPerKg are required when approving',
      );
    }

    // 🔒 Business rule validation
    if (isSingleUse && reuseLimit !== 1) {
      throw new BadRequestException(
        'Single-use material must have reuseLimit = 1',
      );
    }

    if (!isSingleUse && reuseLimit <= 1) {
      throw new BadRequestException(
        'Reusable material must have reuseLimit > 1',
      );
    }

    // Check duplicate material name (case-insensitive)
    const existingMaterial = await this.materialModel.findOne({
      materialName: {
        $regex: new RegExp(`^${request.requestedMaterialName}$`, 'i'),
      },
    });
    if (existingMaterial) {
      throw new ConflictException(
        `Material '${request.requestedMaterialName}' already exists.`,
      );
    }

    // Create new Material
    const newMaterial = await this.materialModel.create({
      materialName: request.requestedMaterialName.trim(),
      isSingleUse,
      reuseLimit,
      co2EmissionPerKg,
      description: request.description,
      isActive: true,
    });

    // Mark request as approved
    request.status = MaterialRequestStatus.APPROVED;
    request.approvedMaterialId = newMaterial._id;
    request.adminNote =
      dto.adminNote?.trim() || 'Material approved and added to system.';
    await request.save();

    // Reject all duplicate pending requests
    await this.materialRequestModel.updateMany(
      {
        _id: { $ne: request._id },
        requestedMaterialName: {
          $regex: new RegExp(`^${request.requestedMaterialName}$`, 'i'),
        },
        status: MaterialRequestStatus.PENDING,
      },
      {
        $set: {
          status: MaterialRequestStatus.REJECTED,
          adminNote:
            'This material was approved from another business request and already exists in the system.',
        },
      },
    );

    return {
      statusCode: HttpStatus.OK,
      message: `Approved material request '${request.requestedMaterialName}' successfully.`,
      data: request,
    };
  }
}
