import { Injectable, BadRequestException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Material, MaterialDocument } from './schemas/material.schema';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { APIResponseDto } from 'src/common/api-response.dto';

@Injectable()
export class MaterialService {
  constructor(
    @InjectModel(Material.name)
    private readonly materialModel: Model<MaterialDocument>,
  ) {}

  // Create material
  async create(
    createMaterialDto: CreateMaterialDto,
  ): Promise<APIResponseDto<Material>> {
    const existingMaterial = await this.materialModel
      .findOne({
        materialName: createMaterialDto.materialName,
      })
      .exec();

    if (existingMaterial) {
      throw new BadRequestException(
        `Material name '${createMaterialDto.materialName}' already exists`,
      );
    }

    const newMaterial = new this.materialModel(createMaterialDto);
    const savedMaterial = await newMaterial.save();

    return {
      statusCode: HttpStatus.CREATED,
      message: `Material '${createMaterialDto.materialName}' created successfully`,
      data: savedMaterial,
    };
  }

  // Get all materials
  async getAll(): Promise<APIResponseDto<Material[]>> {
    const materials = await this.materialModel.find().exec();
    return {
      statusCode: HttpStatus.OK,
      message: 'Materials retrieved successfully',
      data: materials,
    };
  }

  // Get material by ID
  async getById(id: string): Promise<APIResponseDto<Material>> {
    const material = await this.materialModel.findById(id).exec();
    if (!material) {
      throw new BadRequestException(`Material with ID '${id}' not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      message: `Material with ID '${id}' retrieved successfully`,
      data: material,
    };
  }

  // Update material by ID
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
      throw new BadRequestException(`Material with ID '${id}' not found`);
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
        throw new BadRequestException(
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

  // Delete material by ID
  async delete(id: string): Promise<APIResponseDto<null>> {
    const material = await this.materialModel.findById(id).exec();
    if (!material) {
      throw new BadRequestException(`Material with ID '${id}' not found`);
    }

    await this.materialModel.deleteOne({ _id: id }).exec();

    return {
      statusCode: HttpStatus.OK,
      message: `Material with ID '${id}' deleted successfully`,
      data: null,
    };
  }
}
