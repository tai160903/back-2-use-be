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
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

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
  @ApiResponse({
    status: 201,
    description: 'Products created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Products created successfully' },
        count: { type: 'number', example: 10 },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '67305e0a8a2a4b228c2f1a13' },
              productGroupId: {
                type: 'string',
                example: '67305e0a8a2a4b228c2f1a12',
              },
              productSizeId: {
                type: 'string',
                example: '67305e0a8a2a4b228c2f1a11',
              },
              serialNumber: {
                type: 'string',
                example: 'BOT-1731090000000-01234-0',
              },
              qrCode: {
                type: 'string',
                example:
                  'https://res.cloudinary.com/demo/image/upload/qrcodes/BOT-1731090000000-01234-0.png',
              },
              status: { type: 'string', example: 'available' },
              reuseCount: { type: 'number', example: 0 },
              createdAt: {
                type: 'string',
                example: '2025-11-08T14:28:19.000Z',
              },
              updatedAt: {
                type: 'string',
                example: '2025-11-08T14:28:19.000Z',
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Amount must be between 1 and 1000',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - User does not have business role or active subscription',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - User, Business or Product Group not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Product group not found',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
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

  @Get(':productGroupId')
  @ApiOperation({
    summary: 'Get all products for business',
    description:
      'Get paginated list of products for the authenticated business with filters',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['available', 'non-available'],
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
  @ApiResponse({
    status: 200,
    description: 'Product found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            serialNumber: { type: 'string' },
            qrCode: { type: 'string' },
            status: { type: 'string' },
            reuseCount: { type: 'number' },
            productGroupId: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                image: { type: 'string' },
              },
            },
            productSizeId: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
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
  @ApiResponse({
    status: 200,
    description: 'Product found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid product ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
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
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid product ID or data',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
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
  @ApiResponse({
    status: 200,
    description: 'Products fetched successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Products fetched successfully' },
        data: {
          type: 'object',
          properties: {
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string', example: '67305e0a8a2a4b228c2f1a13' },
                  serialNumber: {
                    type: 'string',
                    example: 'BOT-1731090000000-01234-0',
                  },
                  qrCode: {
                    type: 'string',
                    example: 'https://example.com/qrcode.png',
                  },
                  status: { type: 'string', example: 'available' },
                  reuseCount: { type: 'number', example: 0 },
                  createdAt: {
                    type: 'string',
                    example: '2025-11-08T14:28:19.000Z',
                  },
                  updatedAt: {
                    type: 'string',
                    example: '2025-11-08T14:28:19.000Z',
                  },
                },
              },
            },
            total: { type: 'number', example: 100 },
            currentPage: { type: 'number', example: 1 },
            totalPages: { type: 'number', example: 10 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Product group not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @UseGuards(AuthGuard('jwt'))
  getProductsForCustomer(
    @Param('productGroupId') productGroupId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.productsService.getProductsForCustomer(
      productGroupId,
      page,
      limit,
    );
  }
}
