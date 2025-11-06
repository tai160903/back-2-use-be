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
    const { materialName } = createMaterialDto;

    const trimmedName = materialName.trim();

    const existed = await this.materialModel.findOne({
      materialName: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });

    if (existed) {
      throw new HttpException(
        'Material name already exists',
        HttpStatus.CONFLICT,
      );
    }

    const material = await this.materialModel.create({
      ...createMaterialDto,
      materialName: trimmedName,
      createdBy: new Types.ObjectId(adminId),
      isActive: true,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: `Create material '${material.materialName}' successfully`,
      data: material,
    };
  }

  // Admin get all materials (with pagination + optional isActive filter)
  async get(
    query: GetMaterialsQueryDto,
  ): Promise<APIPaginatedResponseDto<Material[]>> {
    const { isActive, page = 1, limit = 10 } = query;
    const filter = typeof isActive === 'boolean' ? { isActive } : {};

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
      throw new NotFoundException(`Material not found`);
    }

    if (
      updateDto.materialName &&
      updateDto.materialName !== material.materialName
    ) {
      const existingMaterial = await this.materialModel
        .findOne({ materialName: updateDto.materialName })
        .exec();

      if (existingMaterial) {
        throw new ConflictException(
          `Material name '${updateDto.materialName}' already exists`,
        );
      }
    }

    if (
      typeof updateDto.isActive === 'boolean' &&
      updateDto.isActive === material.isActive
    ) {
      const stateText = material.isActive ? 'active' : 'inactive';
      return {
        statusCode: HttpStatus.OK,
        message: `Material is already ${stateText}`,
      };
    }

    Object.assign(material, updateDto);
    const updatedMaterial = await material.save();

    return {
      statusCode: HttpStatus.OK,
      message: `Update material '${material.materialName}' successfully`,
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

    // ----- REJECT FLOW -----
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

    // ----- APPROVE FLOW -----
    const { reuseLimit, depositPercent } = dto.materialData || {};
    if (reuseLimit == null || depositPercent == null) {
      throw new BadRequestException(
        'reuseLimit and depositPercent are required when approving',
      );
    }

    // Check duplicate approved material
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

    // Create new material
    const newMaterial = await this.materialModel.create({
      materialName: request.requestedMaterialName,
      reuseLimit,
      depositPercent,
      description: request.description,
      isActive: true,
    });

    // Approve current request
    request.status = MaterialRequestStatus.APPROVED;
    request.approvedMaterialId = newMaterial._id;

    request.adminNote =
      dto.adminNote?.trim() || 'Material approved and added to system.';
    await request.save();

    // Reject all other pending requests with same name
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
            'This material was approved from another business request and already show in the system.',
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
