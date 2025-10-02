import { Controller, Post, Body, UseFilters } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { HttpExceptionFilter } from '../common/http-exception.filter';

import { UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
  @UseInterceptors(FilesInterceptor('files', 2))
  async createBusinessForm(
    @Body() dto: CreateBusinessFormDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const foodLicenseUrl = files[0]
      ? await this.cloudinaryService.uploadFile(files[0])
      : null;
    const businessLicenseUrl = files[1]
      ? await this.cloudinaryService.uploadFile(files[1])
      : null;
    dto.foodLicenseUrl = foodLicenseUrl ?? '';
    dto.businessLicenseUrl = businessLicenseUrl ?? '';
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
