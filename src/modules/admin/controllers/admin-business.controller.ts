import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AdminBusinessService } from '../services/admin-business.service';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { Businesses } from 'src/modules/businesses/schemas/businesses.schema';
import { GetBusinessQueryDto } from '../dto/admin-business/get-businesses-query.dto';
import { SimpleBusinessDto } from '../dto/admin-business/simple-businesses.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { UpdateBusinessBlockStatusDto } from '../dto/admin-business/update-business-block-status.dto';
import { UserResponseDto } from '../dto/admin-customer/user-response.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { RolesEnum } from 'src/common/constants/roles.enum';

@ApiTags('Business (Admin)')
@ApiBearerAuth('access-token')
@Controller('admin/business')
@UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.ADMIN]))
export class AdminBusinessController {
  constructor(private readonly businessService: AdminBusinessService) {}

  // GET admin/business
  @Get()
  async getBusinesses(
    @Query() query: GetBusinessQueryDto,
  ): Promise<APIPaginatedResponseDto<SimpleBusinessDto[]>> {
    return this.businessService.getAllBusinesses(query);
  }

  // GET admin/business
  @Get(':id')
  @ApiParam({ name: 'id', description: 'Business ID' })
  async getBusinessById(
    @Param('id') id: string,
  ): Promise<APIResponseDto<Businesses>> {
    return this.businessService.getBusinessById(id);
  }

  // PATCH admin/business/:id/block-status
  @Patch(':id/block-status')
  @ApiParam({ name: 'id', description: 'User ID' })
  async updateBlockStatus(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateBusinessBlockStatusDto,
  ): Promise<APIResponseDto<UserResponseDto>> {
    const adminId = req.user?._id;
    return this.businessService.updateBlockStatus(id, dto, adminId);
  }
}
