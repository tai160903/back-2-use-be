import { Controller, Post, Body, UseFilters } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { HttpExceptionFilter } from '../common/http-exception.filter';

import { UseInterceptors, UploadedFiles } from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { CreateBusinessFormDto } from './dto/create-business-form.dto';
import { ApiOperation, ApiBody, ApiTags, ApiConsumes } from '@nestjs/swagger';
// import { CreateBusinessDto } from './dto/create-business.dto';
// import { UpdateBusinessDto } from './dto/update-business.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Controller('businesses')
@ApiTags('Businesses')
@UseFilters(HttpExceptionFilter)
export class BusinessesController {
  constructor(
    private readonly businessesService: BusinessesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  @ApiOperation({ summary: 'Get all business forms (paginated)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
      },
      required: [],
    },
  })
  @Post('form/all')
  async getAllForms(@Body() body: { page?: number; limit?: number }) {
    return this.businessesService.getAllForms(body.page ?? 1, body.limit ?? 10);
  }

  @ApiOperation({ summary: 'Get business form detail by id' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '652f1a...' },
      },
      required: ['id'],
    },
  })
  @Post('form/detail')
  async getFormDetail(@Body() body: { id: string }) {
    return this.businessesService.getFormDetail(body.id);
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
        storePhone: { type: 'string', example: '1234567890' },
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
    FileFieldsInterceptor([
      { name: 'foodLicenseFile', maxCount: 1 },
      { name: 'businessLicenseFile', maxCount: 1 },
    ]),
  )
  async createBusinessForm(
    @Body() dto: CreateBusinessFormDto,
    @UploadedFiles()
    files: {
      foodLicenseFile?: Express.Multer.File[];
      businessLicenseFile?: Express.Multer.File[];
    },
  ) {
    console.log(dto);
    console.log(files);
    let foodLicenseUrl = '';
    let businessLicenseUrl = '';
    if (files && files.foodLicenseFile && files.foodLicenseFile.length > 0) {
      if (files.foodLicenseFile[0]) {
        foodLicenseUrl = await this.cloudinaryService.uploadFile(
          files.foodLicenseFile[0],
        );
      }
    }
    if (
      files &&
      files.businessLicenseFile &&
      files.businessLicenseFile.length > 0
    ) {
      if (files.businessLicenseFile[0]) {
        businessLicenseUrl = await this.cloudinaryService.uploadFile(
          files.businessLicenseFile[0],
        );
      }
    }
    dto.foodLicenseUrl = foodLicenseUrl;
    dto.businessLicenseUrl = businessLicenseUrl;
    console.log(dto);
    return this.businessesService.createForm(dto);
  }

  // @Post()
  // create(@Body() createBusinessDto: CreateBusinessDto) {
  //   return this.businessesService.create(createBusinessDto);
  // }

  // @Get()
  // findAll() {
  //   return this.businessesService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.businessesService.findOne(+id);
  // }

  // @Patch(':id')
  // update(
  //   @Param('id') id: string,
  //   @Body() updateBusinessDto: UpdateBusinessDto,
  // ) {
  //   return this.businessesService.update(+id, updateBusinessDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.businessesService.remove(+id);
  // }
}
