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
import { ReviewMaterialRequestDto } from 'src/modules/materials/dto/review-material-request.dto';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { AdminCreateMaterialDto } from '../dto/admin-material/admin-create-material.dto';
import { MaterialRequests } from 'src/modules/materials/schemas/material-requests.schema';
import { GetMaterialRequestsQueryDto } from 'src/modules/materials/dto/get-material-request.dtp';

@ApiTags('Material (Admin)')
@UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.ADMIN]))
@ApiBearerAuth('access-token')
@Controller('admin/materials')
export class AdminMaterialController {
  constructor(private readonly materialService: AdminMaterialService) {}

  // POST /admin/materials
  @Post()
  async create(
    @Body() createMaterialDto: AdminCreateMaterialDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const adminId = req.user?._id;
    return this.materialService.adminCreate(createMaterialDto, adminId);
  }

  // GET /admin/materials
  @Get()
  async getAll(
    @Query() query: GetMaterialsQueryDto,
  ): Promise<APIPaginatedResponseDto<Material[]>> {
    return this.materialService.get(query);
  }

  // GET /admin/materials/material-requests
  @Get('material-requests')
  async getAllRequests(
    @Query() query: GetMaterialRequestsQueryDto,
  ): Promise<APIPaginatedResponseDto<MaterialRequests[]>> {
    return this.materialService.getAllMaterialRequests(query);
  }

  // PATCH /admin/materials/:id
  @Patch(':id')
  @ApiParam({ name: 'id', description: 'Material ID' })
  async update(
    @Param('id') id: string,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ): Promise<APIResponseDto<Material>> {
    return this.materialService.update(id, updateMaterialDto);
  }

  // PATCH /admin/materials/:id/review
  @Patch(':id/review')
  @ApiParam({ name: 'id', description: 'Material Request ID' })
  async reviewMaterialRequest(
    @Param('id') id: string,
    @Body() dto: ReviewMaterialRequestDto,
  ): Promise<APIResponseDto<MaterialRequests>> {
    return this.materialService.reviewMaterialRequest(id, dto);
  }
}
