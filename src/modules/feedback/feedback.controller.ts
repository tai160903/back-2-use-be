import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  UseFilters,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';

@Controller('feedback')
@ApiTags('Feedback')
@UseFilters(HttpExceptionFilter)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiOperation({ summary: 'Create feedback for a business after return' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles(['customer']))
  create(
    @Body() createFeedbackDto: CreateFeedbackDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.feedbackService.create(req.user._id, createFeedbackDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all feedbacks (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'rating',
    required: false,
    type: Number,
    example: 5,
    description: 'Filter by rating (1-5)',
  })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('rating') rating?: number,
  ) {
    return this.feedbackService.findAll(page ?? 1, limit ?? 10, rating);
  }

  @Get('business/:businessId')
  @ApiOperation({ summary: 'Get feedbacks by business ID with stats' })
  @ApiParam({
    name: 'businessId',
    required: true,
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'rating',
    required: false,
    type: Number,
    example: 5,
    description: 'Filter by rating (1-5)',
  })
  findByBusiness(
    @Param('businessId') businessId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('rating') rating?: number,
  ) {
    return this.feedbackService.findByBusiness(
      businessId,
      page ?? 1,
      limit ?? 10,
      rating,
    );
  }

  @Get('my-feedbacks')
  @ApiOperation({ summary: 'Get feedbacks by current customer' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles(['customer']))
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'rating',
    required: false,
    type: Number,
    example: 5,
    description: 'Filter by rating (1-5)',
  })
  findMyFeedbacks(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('rating') rating?: number,
  ) {
    return this.feedbackService.findByCustomer(
      req.user._id,
      page ?? 1,
      limit ?? 10,
      rating,
    );
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get feedbacks by product ID with stats' })
  @ApiParam({
    name: 'productId',
    required: true,
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'rating',
    required: false,
    type: Number,
    example: 5,
    description: 'Filter by rating (1-5)',
  })
  findByProduct(
    @Param('productId') productId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('rating') rating?: number,
  ) {
    return this.feedbackService.findByProduct(
      productId,
      page ?? 1,
      limit ?? 10,
      rating,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get feedback detail by ID' })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  findOne(@Param('id') id: string) {
    return this.feedbackService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update feedback (customer only)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles(['customer']))
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  update(
    @Param('id') id: string,
    @Body() updateFeedbackDto: UpdateFeedbackDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.feedbackService.update(id, req.user._id, updateFeedbackDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete feedback (customer only)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles(['customer']))
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.feedbackService.remove(id, req.user._id);
  }
}
