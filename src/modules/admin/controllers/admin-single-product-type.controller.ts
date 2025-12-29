import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { AdminSingleUseProductTypeService } from '../services/admin-single-product-type.service';
import { CreateSingleUseProductTypeDto } from '../dto/admin-single-product-type/create-single-use-product-type.dto';
import { GetSingleUseProductTypeQueryDto } from '../dto/admin-single-product-type/get-single-use-product-type.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { SingleUseProductType } from 'src/modules/single-use-product-type/schemas/single-use-product-type.schema';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { UpdateSingleUseProductTypeStatusDto } from '../dto/admin-single-product-type/update-single-use-product-type-status.dto';

@ApiTags('Single Use Product Type (Admin)')
@UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.ADMIN]))
@ApiBearerAuth('access-token')
@Controller('admin/single-use-product-type')
export class AdminSingleUseProductTypeController {
  constructor(private readonly service: AdminSingleUseProductTypeService) {}

  // POST /admin/single-use-product-type
  @Post()
  async create(
    @Body() dto: CreateSingleUseProductTypeDto,
  ): Promise<APIResponseDto<SingleUseProductType>> {
    return this.service.create(dto);
  }

  // GET /admin/single-use-product-type
  @Get()
  async get(
    @Query() query: GetSingleUseProductTypeQueryDto,
  ): Promise<APIPaginatedResponseDto<SingleUseProductType[]>> {
    return this.service.get(query);
  }

  // PATCH /admin/single-use-product-type/:id/status
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSingleUseProductTypeStatusDto,
  ) {
    return this.service.updateStatus(id, dto.isActive);
  }
}
