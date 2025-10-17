import {
  Controller,
  Post,
  Body,
  UseFilters,
  UseGuards,
  Get,
  Param,
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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';

@Controller('businesses')
@ApiTags('Businesses')
@UseFilters(HttpExceptionFilter)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @ApiOperation({ summary: 'Get business form detail by id' })
  @ApiParam({ name: 'id', required: true, type: String, example: '652f1a...' })
  @ApiBearerAuth('access-token')
  @UseGuards(RoleCheckGuard.withRoles(['business']))
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
        businessName: { type: 'string', example: 'ABC Store' },
        businessLogo: { type: 'string', format: 'binary' },
        businessType: { type: 'string', example: 'Cafe' },
        businessMail: { type: 'string', example: 'abc@store.com' },
        businessAddress: { type: 'string', example: '123 Main St' },
        businessPhone: { type: 'string', example: '0934567890' },
        taxCode: { type: 'string', example: '987654321' },
        foodSafetyCertUrl: { type: 'string', format: 'binary' },
        businessLicenseFile: { type: 'string', format: 'binary' },
      },
      required: [
        'businessName',
        'businessMail',
        'businessType',
        'businessAddress',
        'businessPhone',
        'taxCode',
        'businessLogo',
        'foodSafetyCertUrl',
        'businessLicenseFile',
      ],
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'businessLogo', maxCount: 1 },
        { name: 'foodSafetyCertUrl', maxCount: 1 },
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
      businessLogo?: Express.Multer.File[];
      foodSafetyCertUrl?: Express.Multer.File[];
      businessLicenseFile?: Express.Multer.File[];
    },
  ) {
    // delegate validation, upload and save to the service
    return this.businessesService.createForm(dto, files);
  }
}
