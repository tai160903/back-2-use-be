import {
  Controller,
  Post,
  Body,
  UseFilters,
  HttpStatus,
  Get,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
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
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
// import { CreateBusinessDto } from './dto/create-business.dto';
// import { UpdateBusinessDto } from './dto/update-business.dto';
import { CloudinaryService } from 'src/infrastructure/cloudinary/cloudinary.service';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';

@Controller('businesses')
@ApiTags('Businesses')
@UseFilters(HttpExceptionFilter)
export class BusinessesController {
  constructor(
    private readonly businessesService: BusinessesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  @ApiOperation({ summary: 'Get all business forms (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    example: 'pending',
    enum: ['pending', 'approve', 'reject'],
    description: 'Filter by status: pending, approve, reject',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(RoleCheckGuard.withRoles(['admin']))
  @Get('form/all')
  async getAllForms(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.businessesService.getAllForms(
      page ?? 1,
      limit ?? 10,
      status ?? '',
    );
  }

  @ApiOperation({ summary: 'Get business form detail by id' })
  @ApiParam({ name: 'id', required: true, type: String, example: '652f1a...' })
  @ApiBearerAuth('access-token')
  @UseGuards(RoleCheckGuard.withRoles(['admin', 'business']))
  @Get('form/detail/:id')
  async getFormDetail(@Param('id') id: string) {
    return this.businessesService.getFormDetail(id);
  }

  @Post('form')
  @ApiOperation({ summary: 'Register Business' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        storeName: { type: 'string', example: 'ABC Store' },
        storeMail: { type: 'string', example: 'abc@store.com' },
        storeAddress: { type: 'string', example: '123 Main St' },
        storePhone: { type: 'string', example: '0934567890' },
        taxCode: { type: 'string', example: '987654321' },
        foodLicenseFile: { type: 'string', format: 'binary' },
        businessLicenseFile: { type: 'string', format: 'binary' },
      },
      required: [
        'storeName',
        'storeMail',
        'storeAddress',
        'storePhone',
        'taxCode',
        'foodLicenseFile',
        'businessLicenseFile',
      ],
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'foodLicenseFile', maxCount: 1 },
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
      foodLicenseFile?: Express.Multer.File[];
      businessLicenseFile?: Express.Multer.File[];
    },
  ) {
    if (
      !files.foodLicenseFile ||
      files.foodLicenseFile.length === 0 ||
      !files.businessLicenseFile ||
      files.businessLicenseFile.length === 0
    ) {
      throw new Error(
        'Both foodLicenseFile and businessLicenseFile must be uploaded.',
      );
    }

    const MAX_FILE_SIZE_MB = 5;
    try {
      if (
        !files.foodLicenseFile ||
        files.foodLicenseFile.length === 0 ||
        !files.businessLicenseFile ||
        files.businessLicenseFile.length === 0
      ) {
        return {
          statusCode: 400,
          message:
            'Both foodLicenseFile and businessLicenseFile must be uploaded.',
        };
      }

      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf',
      ];

      const foodLicenseFile = files.foodLicenseFile[0];
      const businessLicenseFile = files.businessLicenseFile[0];

      if (foodLicenseFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        return {
          statusCode: 413,
          message: `File too large. Maximum allowed is ${MAX_FILE_SIZE_MB}MB`,
        };
      }
      if (businessLicenseFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        return {
          statusCode: 413,
          message: `File too large. Maximum allowed is ${MAX_FILE_SIZE_MB}MB`,
        };
      }
      if (!allowedTypes.includes(foodLicenseFile.mimetype)) {
        return {
          statusCode: 400,
          message: 'foodLicenseFile must be jpg, jpeg, png, or pdf',
        };
      }
      if (!allowedTypes.includes(businessLicenseFile.mimetype)) {
        return {
          statusCode: 400,
          message: 'businessLicenseFile must be jpg, jpeg, png, or pdf',
        };
      }
      const foodLicenseUrl = await this.cloudinaryService.uploadFile(
        foodLicenseFile,
        'business/forms',
      );
      const businessLicenseUrl = await this.cloudinaryService.uploadFile(
        businessLicenseFile,
        'business/forms',
      );

      const businessFormData = {
        ...dto,
        foodLicenseUrl: String(foodLicenseUrl.secure_url),
        businessLicenseUrl: String(businessLicenseUrl.secure_url),
      };
      return this.businessesService.createForm(businessFormData);
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error processing request',
        data: error.message,
      };
    }
  }
}
