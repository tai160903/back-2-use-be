import {
  Controller,
  Post,
  Body,
  UseFilters,
  UseGuards,
  Get,
  Param,
  Req,
  Query,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BusinessesService } from './businesses.service';
import { UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateBusinessFormDto } from './dto/create-business-form.dto';
import {
  ApiOperation,
  ApiBody,
  ApiTags,
  ApiConsumes,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { GetNearbyBusinessesDto } from './dto/get-nearby-businesses.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { Businesses } from './schemas/businesses.schema';

import { GetAllBusinessesDto } from './dto/get-all-businesses.dto';

@Controller('businesses')
@ApiTags('Businesses')
@UseFilters(HttpExceptionFilter)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @ApiOperation({ summary: 'Get business form detail by id' })
  @ApiParam({ name: 'id', required: true, type: String, example: '652f1a...' })
  @ApiBearerAuth('access-token')
  @UseGuards(RoleCheckGuard.withRoles(['business']))
  @Get('form/detail/:id')
  async getFormDetail(@Param('id') id: string) {
    return this.businessesService.getFormDetail(id);
  }

  @Post('form')
  @ApiOperation({ summary: 'Register Business' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles(['customer']))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        businessName: { type: 'string', example: 'ABC Store' },
        businessLogo: { type: 'string', format: 'binary' },
        businessType: { type: 'string', example: 'Cafe' },
        businessMail: { type: 'string', example: 'abc@store.com' },
        businessAddress: { type: 'string', example: '123 Main St' },
        businessPhone: { type: 'string', example: '0934567890' },
        openTime: { type: 'string', example: '08:00' },
        closeTime: { type: 'string', example: '22:00' },
        taxCode: { type: 'string', example: '987654321' },
        foodSafetyCertUrl: { type: 'string', format: 'binary' },
        businessLicenseFile: { type: 'string', format: 'binary' },
      },
      required: [
        'businessName',
        'businessMail',
        'businessType',
        'businessAddress',
        'businessPhone',
        'taxCode',
        'businessLogo',
        'foodSafetyCertUrl',
        'businessLicenseFile',
      ],
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'businessLogo', maxCount: 1 },
        { name: 'foodSafetyCertUrl', maxCount: 1 },
        { name: 'businessLicenseFile', maxCount: 1 },
      ],
      {
        limits: { fileSize: 5 * 1024 * 1024 },
      },
    ),
  )
  async createBusinessForm(
    @Body() dto: CreateBusinessFormDto,
    @UploadedFiles()
    files: {
      businessLogo?: Express.Multer.File[];
      foodSafetyCertUrl?: Express.Multer.File[];
      businessLicenseFile?: Express.Multer.File[];
    },
    @Request() req: any,
  ) {
    return this.businessesService.createForm(req.user._id, dto, files);
  }

  @Post('buy-subscription')
  @ApiOperation({ summary: 'Buy a subscription for business' })
  @ApiBearerAuth('access-token')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        subscriptionId: { type: 'string', example: '64f0c2e5b4d1c2a5e6f7g8h9' },
      },
      required: ['subscriptionId'],
    },
  })
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles(['business']))
  async buySubscription(
    @Req() req: any,
    @Body('subscriptionId') subscriptionId: string,
  ) {
    return this.businessesService.buySubscription(req.user._id, subscriptionId);
  }

  //Get all businesses
  @Get()
  async getAllBusinesses(
    @Query() query: GetAllBusinessesDto,
  ): Promise<APIPaginatedResponseDto<Businesses[]>> {
    return this.businessesService.getAllBusinesses(query);
  }

  //Get nearby businesses
  @Get('nearby')
  async getNearbyBusinesses(
    @Query() query: GetNearbyBusinessesDto,
  ): Promise<APIPaginatedResponseDto<Businesses[]>> {
    return this.businessesService.findNearby(
      query.latitude,
      query.longitude,
      query.radius,
      query.page,
      query.limit,
    );
  }

  @Get('history-business-form')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get history business form' })
  @ApiQuery({
    name: 'status',
    required: false,
    example: 'pending',
    enum: ['pending', 'approved', 'rejected'],
    description: 'Status of the business form history',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Limit of the business form history',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number of the business form history',
  })
  @UseGuards(AuthGuard('jwt'))
  async getHistoryBusinessForm(
    @Req() req: any,
    @Query('status') status: string,
    @Query('limit') limit: number,
    @Query('page') page: number,
  ) {
    return this.businessesService.getHistoryBusinessForm(
      req.user._id,
      status,
      limit,
      page,
    );
  }
}
