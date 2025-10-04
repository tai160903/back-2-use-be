import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { MaterialService } from './material.service';
import { Material } from './schemas/material.schema';
import { CreateMaterialDto } from './dto/create-material.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { GetMaterialsQueryDto } from './dto/get-materials-query.dto';

@Controller('material')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Get()
  async getAllMaterials(
    @Query() query: GetMaterialsQueryDto,
    @Req() req: { user: { _id: string } },
  ) {
    const userId = req.user._id;
    return this.materialService.get(userId, query);
  }
}
