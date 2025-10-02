import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AdminMaterialService } from '../services/admin-material.service';
import { APIResponseDto } from 'src/common/api-response.dto';
import {
  Material,
  MaterialStatus,
} from 'src/materials/schemas/material.schema';
import { UpdateMaterialDto } from 'src/materials/dto/update-material.dto';
import { CreateMaterialDto } from 'src/materials/dto/create-material.dto';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { GetMaterialsQueryDto } from 'src/materials/dto/get-materials-query.dto';
import { APIPaginatedResponseDto } from 'src/common/api-paginated-response.dto';

@ApiTags('Material (Admin)')
@Controller('admin/materials')
export class AdminMaterialController {
  constructor(private readonly materialService: AdminMaterialService) {}

  // POST /admin/materials
  @Post()
  async create(
    @Body() createMaterialDto: CreateMaterialDto,
  ): Promise<APIResponseDto<Material>> {
    return this.materialService.adminCreate(createMaterialDto);
  }

  // GET /admin/materials
  @Get()
  async getAll(
    @Query() query: GetMaterialsQueryDto,
  ): Promise<APIPaginatedResponseDto<Material[]>> {
    return this.materialService.get(query);
  }

  // GET /admin/materials/:id
  @Get(':id')
  async getById(@Param('id') id: string): Promise<APIResponseDto<Material>> {
    return this.materialService.getById(id);
  }

  // PUT /admin/materials/:id
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ): Promise<APIResponseDto<Material>> {
    return this.materialService.update(id, updateMaterialDto);
  }

  // DELETE /admin/materials/:id
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<APIResponseDto<null>> {
    return this.materialService.delete(id);
  }
}
