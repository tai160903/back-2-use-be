import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { AdminSingleUseProductSizeService } from '../services/admin-single-product-size.service';
import { AdminCreateSingleUseProductSizeDto } from '../dto/admin-single-product-size/create-single-use-product-size.dto';
import { GetSingleUseProductSizeQueryDto } from '../dto/admin-single-product-size/get-single-use-product-size-query.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { SingleUseProductSize } from 'src/modules/single-use-product-size/schemas/single-use-product-size.schema';
import { UpdateSingleUseProductSizeStatusDto } from '../dto/admin-single-product-size/update-single-use-product-size-status.dto';

@ApiTags('Single Use Product Size (Admin)')
@UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.ADMIN]))
@ApiBearerAuth('access-token')
@Controller('admin/single-use-product-size')
export class AdminSingleUseProductSizeController {
  constructor(private readonly sizeService: AdminSingleUseProductSizeService) {}

  // POST /admin/single-use-product-size
  @Post()
  async create(
    @Body() dto: AdminCreateSingleUseProductSizeDto,
  ): Promise<APIResponseDto<SingleUseProductSize>> {
    return await this.sizeService.create(dto);
  }

  // GET /admin/single-use-product-size
  @Get()
  async get(
    @Query() query: GetSingleUseProductSizeQueryDto,
  ): Promise<APIResponseDto<SingleUseProductSize[]>> {
    return await this.sizeService.get(query);
  }

  // PATCH /admin/single-use-product-size/:id/status
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSingleUseProductSizeStatusDto,
  ) {
    return this.sizeService.updateStatus(id, dto.isActive);
  }
}
