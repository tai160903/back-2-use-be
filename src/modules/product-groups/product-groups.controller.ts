import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ProductGroupsService } from './product-groups.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { BusinessSubscriptionGuard } from 'src/common/guards/business-subscription.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateProductGroupDto } from './dto/create-product-group.dto';

@ApiTags('Product Groups')
@ApiBearerAuth('access-token')
@Controller('product-groups')
export class ProductGroupsController {
  constructor(private readonly productGroupsService: ProductGroupsService) {}

  @Get()
  @ApiOperation({ summary: 'Get product groups of current business' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'List of product groups' })
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles(['business']))
  getAllProductGroupsByBusiness(
    @Query('limit') limit: number,
    @Query('page') page: number,
    @Request() req: { user: { _id: string } },
  ) {
    return this.productGroupsService.getAllProductGroupsByBusiness(
      req.user._id,
      limit ?? 10,
      page ?? 1,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product group' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Create Product Group with Image Upload',
    schema: {
      type: 'object',
      required: ['materialId', 'name'],
      properties: {
        materialId: {
          type: 'string',
          description: 'Material ID',
          example: '67305e0a8a2a4b228c2f1a11',
        },
        name: {
          type: 'string',
          description: 'Product group name',
          example: 'Refillable Bottles',
        },
        description: {
          type: 'string',
          description: 'Product group description (optional)',
          example: 'Group for refillable water bottles',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Product group image file (jpg, jpeg, png) - optional',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Product group created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(
    AuthGuard('jwt'),
    RoleCheckGuard.withRoles(['business']),
    BusinessSubscriptionGuard,
  )
  @UseInterceptors(FileInterceptor('image'))
  createProductGroup(
    @Body() createProductGroupDto: CreateProductGroupDto,
    @Request() req: { user: { _id: string } },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.productGroupsService.createProductGroup(
      createProductGroupDto,
      req.user._id,
      file,
    );
  }
}
