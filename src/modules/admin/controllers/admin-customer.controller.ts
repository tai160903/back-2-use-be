import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { AdminCustomerService } from '../services/admin-customer.service';
import { GetCustomerQueryDto } from '../dto/admin-customer/get-customers-query.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { Users } from 'src/modules/users/schemas/users.schema';
import { UpdateCustomerBlockStatusDto } from '../dto/admin-customer/update-customer-block-status.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';

@ApiTags('Customer (Admin)')
@Controller('admin/customers')
export class AdminCustomerController {
  constructor(private readonly customerService: AdminCustomerService) {}

  // GET admin/customers
  @Get()
  async getAllCustomers(
    @Query() query: GetCustomerQueryDto,
  ): Promise<APIPaginatedResponseDto<Users[]>> {
    return this.customerService.getAllCustomers(query);
  }

  // PATCH admin/customers/:id/block-status
  @Patch(':id/block-status')
  @ApiParam({ name: 'id', description: 'Customer ID' })
  async updateBlockStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerBlockStatusDto,
  ): Promise<APIResponseDto<Users>> {
    return this.customerService.updateBlockStatus(id, dto.isBlocked);
  }
}
