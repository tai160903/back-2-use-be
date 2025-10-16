import { Injectable, HttpStatus, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Material, MaterialDocument } from './schemas/material.schema';
import { GetMaterialsQueryDto } from './dto/get-materials-query.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { GetMyMaterialsQueryDto } from './dto/get-my-materials.dto';
import { paginate } from 'src/common/utils/pagination.util';
import { MaterialStatus } from 'src/common/constants/material-status.enum';

@Injectable()
export class MaterialService {
  constructor(
    @InjectModel(Material.name)
    private readonly materialModel: Model<MaterialDocument>,
  ) {}

  // Business create material
  async create(
    createMaterialDto: CreateMaterialDto,
    userPayload: { _id: string },
  ): Promise<APIResponseDto<Material>> {
    const existingMaterial = await this.materialModel.findOne({
      materialName: createMaterialDto.materialName,
      status: MaterialStatus.APPROVED,
    });

    if (existingMaterial) {
      throw new ConflictException(
        `Material name '${createMaterialDto.materialName}' already exists`,
      );
    }

    const newMaterial = new this.materialModel({
      ...createMaterialDto,
      status: MaterialStatus.PENDING,
      createdBy: userPayload._id,
    });

    const savedMaterial = await newMaterial.save();

    return {
      statusCode: HttpStatus.CREATED,
      message: `Create material '${createMaterialDto.materialName}' successfully`,
      data: savedMaterial,
    };
  }

  // Business get approved materials
  async getApprovedMaterials(
    query: GetMaterialsQueryDto,
  ): Promise<APIPaginatedResponseDto<Material[]>> {
    const { page = 1, limit = 10 } = query;
    const filter = { status: MaterialStatus.APPROVED };

    const { data, total, currentPage, totalPages } =
      await paginate<MaterialDocument>(this.materialModel, filter, page, limit);

    return {
      statusCode: HttpStatus.OK,
      message: 'Get approved materials successfully',
      data,
      total,
      currentPage,
      totalPages,
    };
  }

  // Business get pending + rejected materials
  async getMyMaterials(
    userId: string,
    query: GetMyMaterialsQueryDto,
  ): Promise<APIPaginatedResponseDto<Material[]>> {
    const { status, page = 1, limit = 10 } = query;

    const filter: any = {
      createdBy: userId,
      status: status || {
        $in: [MaterialStatus.PENDING, MaterialStatus.REJECTED],
      },
    };

    const { data, total, currentPage, totalPages } =
      await paginate<MaterialDocument>(this.materialModel, filter, page, limit);

    return {
      statusCode: HttpStatus.OK,
      message: 'Get your materials successfully',
      data,
      total,
      currentPage,
      totalPages,
    };
  }
}
