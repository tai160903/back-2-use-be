import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';

import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import {
  Material,
  MaterialDocument,
} from 'src/modules/materials/schemas/material.schema';
import { CreateMaterialDto } from 'src/modules/materials/dto/create-material.dto';
import { GetMaterialsQueryDto } from 'src/modules/materials/dto/get-materials-query.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { UpdateMaterialDto } from 'src/modules/materials/dto/update-material.dto';
import { UpdateMaterialStatusDto } from 'src/modules/materials/dto/update-material-status.dto';
import { paginate } from 'src/common/utils/pagination.util';
import { MaterialStatus } from 'src/common/constants/material-status.enum';

@Injectable()
export class AdminMaterialService {
  constructor(
    @InjectModel(Material.name)
    private readonly materialModel: Model<MaterialDocument>,
  ) {}

  // Admin create material
  async adminCreate(
    createMaterialDto: CreateMaterialDto,
    userPayload: { _id: string; role: string },
  ): Promise<APIResponseDto<Material>> {
    const existingMaterial = await this.materialModel.findOne({
      materialName: createMaterialDto.materialName,
    });

    if (existingMaterial) {
      throw new ConflictException(
        `Material name '${createMaterialDto.materialName}' already exists`,
      );
    }

    const newMaterial = new this.materialModel({
      ...createMaterialDto,
      status: MaterialStatus.APPROVED,
      createdBy: userPayload._id,
    });

    const savedMaterial = await newMaterial.save();

    return {
      statusCode: HttpStatus.CREATED,
      message: `Create material '${createMaterialDto.materialName}' successfully`,
      data: savedMaterial,
    };
  }

  // Admin get all materials (with pagination + optional status filter)
  async get(
    query: GetMaterialsQueryDto,
  ): Promise<APIPaginatedResponseDto<Material[]>> {
    const { status, page = 1, limit = 10 } = query;
    const filter = status ? { status } : {};

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

  // Admin get material by ID
  async getById(id: string): Promise<APIResponseDto<Material>> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid Material ID '${id}'`);
    }

    const material = await this.materialModel.findById(id).exec();

    if (!material) {
      throw new NotFoundException(`Material not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      message: `Get material successfully`,
      data: material,
    };
  }

  // Admin approve or reject material by ID
  async reviewMaterial(
    id: string,
    dto: UpdateMaterialStatusDto,
  ): Promise<APIResponseDto<Material>> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid Material ID '${id}'`);
    }

    const material = await this.materialModel.findById(id);
    if (!material) {
      throw new NotFoundException('Material not found');
    }

    if (material.status !== MaterialStatus.PENDING) {
      throw new BadRequestException('Only pending materials can be reviewed');
    }

    material.status = dto.status;
    material.rejectReason =
      dto.status === MaterialStatus.REJECTED ? dto.rejectReason : undefined;

    await material.save();

    return {
      statusCode: HttpStatus.OK,
      message: `Review material '${material.materialName}' successfully`,
      data: material,
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

    Object.assign(material, updateDto);
    const updatedMaterial = await material.save();

    return {
      statusCode: HttpStatus.OK,
      message: `Update material '${material.materialName}' successfully`,
      data: updatedMaterial,
    };
  }

  // Admin delete material by ID
  async delete(id: string): Promise<APIResponseDto<null>> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid Material ID '${id}'`);
    }

    const material = await this.materialModel.findById(id).exec();
    if (!material) {
      throw new NotFoundException(`Material not found`);
    }

    await this.materialModel.deleteOne({ _id: id }).exec();

    return {
      statusCode: HttpStatus.OK,
      message: `Delete material '${material.materialName}' successfully`,
    };
  }
}
