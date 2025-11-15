import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
  Param,
  Patch,
} from '@nestjs/common';
import { ProductSizesService } from './product-sizes.service';
import { CreateProductSizeDto } from './dto/create-product-size.dto';
import { UpdateProductSizeDto } from './dto/update-product-size.dto';
import { AuthGuard } from '@nestjs/passport';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { BusinessSubscriptionGuard } from 'src/common/guards/business-subscription.guard';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';

@ApiTags('Product Sizes')
@ApiBearerAuth('access-token')
@Controller('product-sizes')
export class ProductSizesController {
  constructor(private readonly productSizesService: ProductSizesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product size' })
  @ApiBody({
    description: 'Create product size with details',
    schema: {
      type: 'object',
      required: ['productGroupId', 'sizeName', 'basePrice'],
      properties: {
        productGroupId: {
          type: 'string',
          description: 'Product Group ID',
          example: '64f0c2e5b4d1c2a5e6f7g8h9',
        },
        sizeName: {
          type: 'string',
          description: 'Size name',
          example: 'Medium',
        },
        basePrice: {
          type: 'number',
          description: 'Base price (cost price)',
          example: 50000,
        },
        weight: {
          type: 'number',
          description: 'Weight for this size (grams)',
          example: 500,
        },
        description: {
          type: 'string',
          description: 'Size description (optional)',
          example: '500ml bottle',
        },
      },
    },
  })
  @UseGuards(
    AuthGuard('jwt'),
    RoleCheckGuard.withRoles(['business']),
    BusinessSubscriptionGuard,
  )
  create(
    @Body() createProductSizeDto: CreateProductSizeDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.productSizesService.createProductSize(
      createProductSizeDto,
      req.user._id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get product sizes of a group' })
  @ApiQuery({
    name: 'productGroupId',
    required: true,
    description: 'Product Group ID',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @UseGuards(
    AuthGuard('jwt'),
    RoleCheckGuard.withRoles(['business']),
    BusinessSubscriptionGuard,
  )
  getAll(
    @Query('productGroupId') productGroupId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Request() req: AuthenticatedRequest,
  ) {
    const p = Number(page) || 1;
    const l = Number(limit) || 10;
    return this.productSizesService.getProductSizes(
      req.user._id,
      productGroupId,
      p,
      l,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product size detail' })
  @ApiParam({ name: 'id', description: 'Product Size ID' })
  @UseGuards(
    AuthGuard('jwt'),
    RoleCheckGuard.withRoles(['business']),
    BusinessSubscriptionGuard,
  )
  getDetail(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.productSizesService.getProductSizeDetail(req.user._id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product size' })
  @ApiParam({ name: 'id', description: 'Product Size ID' })
  @ApiBody({
    description: 'Fields to update (partial allowed)',
    schema: {
      type: 'object',
      properties: {
        sizeName: { type: 'string', example: 'Large' },
        basePrice: { type: 'number', example: 60000 },
        weight: { type: 'number', example: 750 },
        description: { type: 'string', example: '750ml bottle' },
      },
    },
  })
  @UseGuards(
    AuthGuard('jwt'),
    RoleCheckGuard.withRoles(['business']),
    BusinessSubscriptionGuard,
  )
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProductSizeDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.productSizesService.updateProductSize(
      req.user._id,
      id,
      updateDto,
    );
  }
}
