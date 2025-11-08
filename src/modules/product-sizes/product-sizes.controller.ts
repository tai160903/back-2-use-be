import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ProductSizesService } from './product-sizes.service';
import { CreateProductSizeDto } from './dto/create-product-size.dto';
import { AuthGuard } from '@nestjs/passport';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { BusinessSubscriptionGuard } from 'src/common/guards/business-subscription.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
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
}
