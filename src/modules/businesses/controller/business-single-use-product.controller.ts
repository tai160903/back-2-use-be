import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { BusinessSingleUseProductService } from '../services/business-single-use-product.service';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { SingleUseProductType } from 'src/modules/single-use-product-type/schemas/single-use-product-type.schema';
import { SingleUseProductSize } from 'src/modules/single-use-product-size/schemas/single-use-product-size.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { CreateSingleUseProductDto } from 'src/modules/businesses/dto/create-single-use-product.dto';
import { SingleUseProduct } from 'src/modules/single-use-product/schemas/single-use-product.schema';
import { UpdateSingleUseProductDto } from '../dto/update-single-use-product.dto';
import { GetMySingleUseProductQueryDto } from '../dto/get-my-single-use-product';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';

@ApiTags('Single Use Product (Business)')
@UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.BUSINESS]))
@ApiBearerAuth('access-token')
@Controller('business/single-use-product')
export class BusinessSingleUseProductController {
  constructor(private readonly service: BusinessSingleUseProductService) {}

  //   GET business/single-use-product/types
  @Get('/types')
  async getActiveTypes(): Promise<APIResponseDto<SingleUseProductType[]>> {
    return this.service.getActiveTypes();
  }

  //   GET business/single-use-product/sizes
  @Get('/sizes')
  async getActiveSizes(
    @Query('productTypeId') productTypeId?: string,
  ): Promise<APIResponseDto<SingleUseProductSize[]>> {
    return this.service.getActiveSizes(productTypeId);
  }

  //   POST business/single-use-product
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
        name: {
          type: 'string',
          example: 'Plastic Cup 12oz',
        },
        description: {
          type: 'string',
          example: 'Single-use plastic cup',
        },
        productTypeId: {
          type: 'string',
          example: '64fxxxx',
        },
        productSizeId: {
          type: 'string',
          example: '64fxxxx',
        },
        materialId: {
          type: 'string',
          example: '64fxxxx',
        },
        weight: {
          type: 'number',
          example: 12,
        },
      },
      required: [
        'name',
        'productTypeId',
        'productSizeId',
        'materialId',
        'weight',
      ],
    },
  })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSingleUseProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<APIResponseDto<SingleUseProduct>> {
    const userId = req.user?._id;
    return this.service.create(userId, dto, file);
  }

  //   PATCH business/single-use-product/:productId
  @Patch(':productId')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
        name: { type: 'string' },
        description: { type: 'string' },
        weight: { type: 'number' },
        isActive: { type: 'boolean' },
      },
    },
  })
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('productId') productId: string,
    @Body() dto: UpdateSingleUseProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<APIResponseDto<SingleUseProduct>> {
    const userId = req.user?._id;
    return this.service.update(userId, productId, dto, file);
  }

  @Get('/my')
  async getMyProducts(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetMySingleUseProductQueryDto,
  ): Promise<APIPaginatedResponseDto<SingleUseProduct[]>> {
    const userId = req.user?._id;
    return this.service.getMyProducts(userId, query);
  }
}
