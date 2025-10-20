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
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { AdminCustomerService } from '../services/admin-customer.service';
import { GetCustomerQueryDto } from '../dto/admin-customer/get-customers-query.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { Users } from 'src/modules/users/schemas/users.schema';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserResponseDto } from '../dto/admin-customer/user-response.dto';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { UpdateCustomerBlockStatusDto } from '../dto/admin-customer/update-customer-block-status.dto';
import { MailerService } from 'src/infrastructure/mailer/mailer.service';
import { Customers } from 'src/modules/users/schemas/customer.schema';

@ApiTags('Customer (Admin)')
@ApiBearerAuth('access-token')
@Controller('admin/customers')
@UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.ADMIN]))
export class AdminCustomerController {
  constructor(private readonly customerService: AdminCustomerService) {}

  // GET admin/customers
  @Get()
  async getAllCustomers(
    @Query() query: GetCustomerQueryDto,
  ): Promise<APIPaginatedResponseDto<UserResponseDto[]>> {
    return this.customerService.getAllCustomers(query);
  }

  // GET admin/customers/:id
  @Get(':id')
  @ApiParam({ name: 'id', description: 'Customer ID' })
  async getCustomerById(
    @Param('id') id: string,
  ): Promise<APIResponseDto<Customers>> {
    return this.customerService.getCustomerById(id);
  }

  // PATCH admin/customers/:id/block-status
  @Patch(':id/block-status')
  @ApiParam({ name: 'id', description: 'Customer ID' })
  async updateBlockStatus(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerBlockStatusDto,
  ): Promise<APIResponseDto<UserResponseDto>> {
    const adminId = req.user?._id;
    return this.customerService.updateBlockStatus(id, dto, adminId);
  }
}
