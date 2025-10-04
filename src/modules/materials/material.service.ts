import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Material,
  MaterialDocument,
  MaterialStatus,
} from './schemas/material.schema';
import { GetMaterialsQueryDto } from './dto/get-materials-query.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';

@Injectable()
export class MaterialService {
  constructor(
    @InjectModel(Material.name)
    private readonly materialModel: Model<MaterialDocument>,
  ) {}

  // Business get material
  async get(
    userId: string, // Nhận userId từ controller
    query: GetMaterialsQueryDto,
  ): Promise<APIPaginatedResponseDto<Material[]>> {
    const { status, page = 1, limit = 10 } = query;

    let filter: any = {};

    if (status === MaterialStatus.APPROVED) {
      filter.status = MaterialStatus.APPROVED;
    } else if (
      status === MaterialStatus.PENDING ||
      status === MaterialStatus.REJECTED
    ) {
      filter = { status, createdBy: userId }; // Sử dụng userId trong filter
    } else {
      filter.status = MaterialStatus.APPROVED;
    }

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
}
