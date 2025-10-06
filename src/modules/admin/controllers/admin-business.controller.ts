// import { Controller, Get, Query } from '@nestjs/common';
// import { ApiTags } from '@nestjs/swagger';
// import { AdminBusinessService } from '../services/admin-business.service';
// import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
// import { Businesses } from 'src/modules/businesses/schemas/businesses.schema';
// import { GetBusinessQueryDto } from '../dto/admin-business/get-businesses-query.dto';

// @ApiTags('Business (Admin)')
// @Controller('admin/business')
// export class AdminBusinessController {
//   constructor(private readonly businessService: AdminBusinessService) {}

//   // GET admin/business
//   async getAllBusinesses(
//     @Query() query: GetBusinessQueryDto,
//   ): Promise<APIPaginatedResponseDto<Businesses[]>> {
//     return this.businessService.getAllBusinesses(query);
//   }
// }
