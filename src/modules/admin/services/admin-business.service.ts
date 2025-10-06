// import { Model } from 'mongoose';
// import { Injectable, Inject, HttpStatus } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import {
//   BusinessDocument,
//   Businesses,
// } from 'src/modules/businesses/schemas/businesses.schema';
// import { GetBusinessQueryDto } from '../dto/admin-business/get-businesses-query.dto';
// import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
// import { APIResponseDto } from 'src/common/dtos/api-response.dto';

// @Injectable()
// export class AdminBusinessService {
//   constructor(
//     @InjectModel(Businesses.name)
//     private readonly businessModel: Model<BusinessDocument>,
//   ) {}

//   // Admin get all businesses
//   async getAllBusinesses(
//     query: GetBusinessQueryDto,
//   ): Promise<APIPaginatedResponseDto<Businesses[]>> {
//     const { isBlocked, page = 1, limit = 10 } = query;

//     const business = this.businessModel.find().exec;

//     return {
//       statusCode: HttpStatus.OK,
//       message: 'ok',
//       data: business,
//     };
//   }
// }
