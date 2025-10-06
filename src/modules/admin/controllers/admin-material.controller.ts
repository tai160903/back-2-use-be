import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminMaterialService } from '../services/admin-material.service';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateMaterialDto } from 'src/modules/materials/dto/create-material.dto';
import { Material } from 'src/modules/materials/schemas/material.schema';
import { GetMaterialsQueryDto } from 'src/modules/materials/dto/get-materials-query.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { UpdateMaterialDto } from 'src/modules/materials/dto/update-material.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { UpdateMaterialStatusDto } from 'src/modules/materials/dto/update-material-status.dto';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { RolesEnum } from 'src/common/constants/roles.enum';

@ApiTags('Material (Admin)')
@UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.ADMIN]))
@ApiBearerAuth('access-token')
@Controller('admin/materials')
export class AdminMaterialController {
  constructor(private readonly materialService: AdminMaterialService) {}

  // POST /admin/materials
  @Post()
  async create(
    @Body() createMaterialDto: CreateMaterialDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materialService.adminCreate(createMaterialDto, req.user);
  }

  // GET /admin/materials
  @Get()
  async getAll(
    @Query() query: GetMaterialsQueryDto,
  ): Promise<APIPaginatedResponseDto<Material[]>> {
    return this.materialService.get(query);
  }

  // PATCH /admin/materials/:id/review
  @Patch(':id/review')
  @ApiParam({ name: 'id', description: 'Material ID' })
  async reviewMaterial(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialStatusDto,
  ): Promise<APIResponseDto<Material>> {
    return this.materialService.reviewMaterial(id, dto);
  }

  // GET /admin/materials/:id
  @Get(':id')
  @ApiParam({ name: 'id', description: 'Material ID' })
  async getById(@Param('id') id: string): Promise<APIResponseDto<Material>> {
    return this.materialService.getById(id);
  }

  // PUT /admin/materials/:id
  @Put(':id')
  @ApiParam({ name: 'id', description: 'Material ID' })
  async update(
    @Param('id') id: string,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ): Promise<APIResponseDto<Material>> {
    return this.materialService.update(id, updateMaterialDto);
  }

  // DELETE /admin/materials/:id
  @Delete(':id')
  @ApiParam({ name: 'id', description: 'Material ID' })
  async delete(@Param('id') id: string): Promise<APIResponseDto<null>> {
    return this.materialService.delete(id);
  }
}
