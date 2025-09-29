import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { MaterialService } from './material.service';
import { Material } from './schemas/material.schema';
import { CreateMaterialDto } from './dto/create-material.dto';
import { APIResponseDto } from 'src/common/api-response.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Controller('material')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  // POST /material
  @Post()
  async create(
    @Body() createMaterialDto: CreateMaterialDto,
  ): Promise<APIResponseDto<Material>> {
    return this.materialService.create(createMaterialDto);
  }

  // GET /material
  @Get()
  async getAll(): Promise<APIResponseDto<Material[]>> {
    return this.materialService.getAll();
  }

  // GET /material/:id
  @Get(':id')
  async getById(@Param('id') id: string): Promise<APIResponseDto<Material>> {
    return this.materialService.getById(id);
  }

  // PUT /material/:id
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ): Promise<APIResponseDto<Material>> {
    return this.materialService.update(id, updateMaterialDto);
  }

  // DELETE /material/:id
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<APIResponseDto<null>> {
    return this.materialService.delete(id);
  }
}
