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
  UseGuards,
} from '@nestjs/common';
import { MaterialService } from './material.service';
import { Material } from './schemas/material.schema';
import { CreateMaterialDto } from './dto/create-material.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { GetMaterialsQueryDto } from './dto/get-materials-query.dto';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { GetActiveMaterialsQueryDto } from './dto/get-approved-materials.dto';
import { GetMyMaterialsQueryDto } from './dto/get-my-materials.dto';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { MaterialRequests } from './schemas/material-requests.schema';

@ApiTags('Material (Business)')
@Controller('materials')
@UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.BUSINESS]))
@ApiBearerAuth('access-token')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  // GET /materials
  @Get()
  async getActiveMaterials(@Query() query: GetActiveMaterialsQueryDto) {
    return this.materialService.getActiveMaterials(query);
  }

  // POST /materials/material-requests
  @Post('material-requests')
  async create(
    @Body() CreateMaterialDto: CreateMaterialDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?._id;
    return this.materialService.createMaterialRequest(
      CreateMaterialDto,
      userId,
    );
  }

  @Get('my-request')
  async getOwnMaterialRequests(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetMyMaterialsQueryDto,
  ): Promise<APIPaginatedResponseDto<MaterialRequests[]>> {
    return this.materialService.getMyMaterialRequests(req.user._id, query);
  }
}
