import { Model } from 'mongoose';
import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import {
  Material,
  MaterialDocument,
  MaterialStatus,
} from 'src/modules/materials/schemas/material.schema';
import { CreateMaterialDto } from 'src/modules/materials/dto/create-material.dto';
import { GetMaterialsQueryDto } from 'src/modules/materials/dto/get-materials-query.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { UpdateMaterialDto } from 'src/modules/materials/dto/update-material.dto';
import { UpdateMaterialStatusDto } from 'src/modules/materials/dto/update-material-status.dto';

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
      message: `Material '${createMaterialDto.materialName}' created successfully`,
      data: savedMaterial,
    };
  }

  // Admin get material
  async get(
    query: GetMaterialsQueryDto,
  ): Promise<APIPaginatedResponseDto<Material[]>> {
    const { status, page = 1, limit = 10 } = query;
    const filter = status ? { status } : {};

    const [materials, total] = await Promise.all([
      this.materialModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.materialModel.countDocuments(filter),
    ]);

    return {
      statusCode: HttpStatus.OK,
      message: 'Materials retrieved successfully',
      data: materials,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Admin get material by ID
  async getById(id: string): Promise<APIResponseDto<Material>> {
    const material = await this.materialModel.findById(id).exec();
    if (!material) {
      throw new NotFoundException(`Material with ID '${id}' not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      message: `Material with ID '${id}' retrieved successfully`,
      data: material,
    };
  }

  // Admin approve or reject material by ID
  async reviewMaterial(
    id: string,
    dto: UpdateMaterialStatusDto,
  ): Promise<APIResponseDto<Material>> {
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
      message: `Material with ID '${id}' review successfully`,
      data: material,
    };
  }

  // Admin update material by ID
  async update(
    id: string,
    updateDto: UpdateMaterialDto,
  ): Promise<APIResponseDto<Material>> {
    if (!updateDto || Object.keys(updateDto).length === 0) {
      throw new BadRequestException(
        'At least one field must be provided for update',
      );
    }

    const material = await this.materialModel.findById(id).exec();
    if (!material) {
      throw new NotFoundException(`Material with ID '${id}' not found`);
    }

    if (
      updateDto.materialName &&
      updateDto.materialName !== material.materialName
    ) {
      const existingMaterial = await this.materialModel
        .findOne({
          materialName: updateDto.materialName,
        })
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
      message: `Material with ID '${id}' updated successfully`,
      data: updatedMaterial,
    };
  }

  // Admin delete material by ID
  async delete(id: string): Promise<APIResponseDto<null>> {
    const material = await this.materialModel.findById(id).exec();
    if (!material) {
      throw new NotFoundException(`Material with ID '${id}' not found`);
    }

    await this.materialModel.deleteOne({ _id: id }).exec();

    return {
      statusCode: HttpStatus.OK,
      message: `Material with ID '${id}' deleted successfully`,
    };
  }
}
