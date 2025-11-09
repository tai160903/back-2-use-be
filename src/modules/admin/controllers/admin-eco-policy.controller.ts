// src/modules/eco-reward-policies/controllers/admin-eco-reward-policies.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiParam,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { AdminEcoRewardPoliciesService } from '../services/admin-eco-policy.service';
import { CreateEcoRewardPolicyDto } from '../dto/admin-eco-policy/create-eco-reward-policy.dto';
import { UpdateEcoRewardPolicyDto } from '../dto/admin-eco-policy/update-eco-reward-policy.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { GetEcoRewardPoliciesQueryDto } from '../dto/admin-eco-policy/get-eco-reward-policies-query.dto';
import { EcoRewardPolicy } from 'src/modules/eco-reward-policies/schemas/eco-reward-policy.schema';

@ApiTags('Eco Reward Policies (Admin)')
@UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.ADMIN]))
@ApiBearerAuth('access-token')
@Controller('admin/eco-reward-policies')
export class AdminEcoRewardPoliciesController {
  constructor(
    private readonly ecoRewardPoliciesService: AdminEcoRewardPoliciesService,
  ) {}

  // POST /admin/eco-reward-policies
  @Post()
  @ApiOperation({ summary: 'Admin create new eco reward policy' })
  async create(
    @Body() dto: CreateEcoRewardPolicyDto,
  ): Promise<APIResponseDto<EcoRewardPolicy>> {
    return this.ecoRewardPoliciesService.create(dto);
  }

  // GET /admin/eco-reward-policies
  @Get()
  @ApiOperation({ summary: 'Admin get all eco reward policies (paginated)' })
  async getAll(
    @Query() query: GetEcoRewardPoliciesQueryDto,
  ): Promise<APIPaginatedResponseDto<EcoRewardPolicy[]>> {
    return this.ecoRewardPoliciesService.getAll(query);
  }

  // GET /admin/eco-reward-policies/:id
  @Get(':id')
  @ApiParam({ name: 'id', description: 'Eco reward policy ID' })
  @ApiOperation({ summary: 'Admin get eco reward policy detail by ID' })
  async findOne(
    @Param('id') id: string,
  ): Promise<APIResponseDto<EcoRewardPolicy>> {
    return this.ecoRewardPoliciesService.findOne(id);
  }

  // PATCH /admin/eco-reward-policies/:id
  @Patch(':id')
  @ApiParam({ name: 'id', description: 'Eco reward policy ID' })
  @ApiOperation({ summary: 'Admin update eco reward policy by ID' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEcoRewardPolicyDto,
  ): Promise<APIResponseDto<EcoRewardPolicy>> {
    return this.ecoRewardPoliciesService.update(id, dto);
  }

  // DELETE /admin/eco-reward-policies/:id
  @Delete(':id')
  @ApiParam({ name: 'id', description: 'Eco reward policy ID' })
  @ApiOperation({ summary: 'Admin delete eco reward policy by ID' })
  async remove(@Param('id') id: string): Promise<APIResponseDto<null>> {
    return this.ecoRewardPoliciesService.remove(id);
  }
}
