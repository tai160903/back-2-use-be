import {
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
  Get,
  Query,
  Param,
  Patch,
  // Patch, // temporarily disabled update endpoint
  // Delete, // temporarily disabled delete endpoint
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { BusinessSubscriptionGuard } from 'src/common/guards/business-subscription.guard';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { RolesEnum } from 'src/common/constants/roles.enum';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { ProductCondition } from 'src/common/constants/product-condition.enum';
import { ProductStatus } from 'src/common/constants/product-status.enum';

@ApiTags('Products')
@ApiBearerAuth('access-token')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create multiple products with QR codes',
    description:
      'Creates multiple products for a business with unique serial numbers and QR codes uploaded to Cloudinary. Requires business role and active subscription.',
  })
  @UseGuards(
    AuthGuard('jwt'),
    BusinessSubscriptionGuard,
    RoleCheckGuard.withRoles([RolesEnum.BUSINESS]),
  )
  createProduct(
    @Body() createProductDto: CreateProductDto,
    @Request() req: { user: { _id: string } },
  ) {
    return this.productsService.createProducts(createProductDto, req.user._id);
  }

  @Get('group/:productGroupId')
  @ApiOperation({
    summary: 'Get all products for business (by group)',
    description:
      'Get paginated list of products for the authenticated business with filters by product group ID',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ProductStatus,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by serial number',
  })
  @UseGuards(
    AuthGuard('jwt'),
    BusinessSubscriptionGuard,
    RoleCheckGuard.withRoles([RolesEnum.BUSINESS]),
  )
  getAllProducts(
    @Param('productGroupId') productGroupId: string,
    @Query() query: QueryProductDto,
    @Request() req: { user: { _id: string } },
  ) {
    return this.productsService.getAllProducts(
      req.user._id,
      productGroupId,
      query,
    );
  }

  @Get('scan/:serialNumber')
  @ApiOperation({
    summary: 'Get product by serial number (QR scan)',
    description:
      'Get product details by scanning QR code serial number. No authentication required.',
  })
  @ApiParam({
    name: 'serialNumber',
    description: 'Product serial number from QR code',
    example: 'BOT-1731090000000-01234-0',
  })
  getProductBySerialNumber(@Param('serialNumber') serialNumber: string) {
    return this.productsService.getProductBySerialNumber(serialNumber);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product by ID',
    description: 'Get detailed information about a specific product',
  })
  @ApiParam({
    name: 'id',
    description: 'Product ID',
    example: '67305e0a8a2a4b228c2f1a13',
  })
  @UseGuards(AuthGuard('jwt'))
  getProductById(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update product',
    description:
      'Update product status, condition, condition note, or condition image',
  })
  @ApiParam({
    name: 'id',
    description: 'Product ID',
    example: '67305e0a8a2a4b228c2f1a13',
  })
  @UseGuards(
    AuthGuard('jwt'),
    BusinessSubscriptionGuard,
    RoleCheckGuard.withRoles([RolesEnum.BUSINESS]),
  )
  updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(id, updateProductDto);
  }

  @Get('customer/:productGroupId')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get products for a specific product group',
    description: 'Fetch paginated products for a given product group ID',
  })
  @ApiParam({
    name: 'productGroupId',
    description: 'ID of the product group',
    example: '67305e0a8a2a4b228c2f1a12',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ProductStatus,
    description: 'Filter by product status',
  })
  @ApiQuery({
    name: 'condition',
    required: false,
    enum: ProductCondition,
    description: 'Filter by product condition',
  })
  @UseGuards(AuthGuard('jwt'))
  getProductsForCustomer(
    @Param('productGroupId') productGroupId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('condition') condition?: string,
  ) {
    return this.productsService.getProductsForCustomer(
      productGroupId,
      page,
      limit,
      status,
      condition,
    );
  }
}
