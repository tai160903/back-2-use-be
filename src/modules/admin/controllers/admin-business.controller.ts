import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { AdminBusinessService } from '../services/admin-business.service';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { Businesses } from 'src/modules/businesses/schemas/businesses.schema';
import { GetBusinessQueryDto } from '../dto/admin-business/get-businesses-query.dto';
import { SimpleBusinessDto } from '../dto/admin-business/simple-businesses.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';

@ApiTags('Business (Admin)')
@Controller('admin/business')
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
}
