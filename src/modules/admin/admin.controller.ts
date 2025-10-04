import {
  Controller,
  UseFilters,
  // Get,
  // Post,
  // Body,
  // Patch,
  // Param,
  // Delete,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UseGuards, Body, Param, Patch } from '@nestjs/common';
import { AdminGuard } from '../../common/guards/admin.guard';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
// import { CreateAdminDto } from './dto/create-admin.dto';
// import { UpdateAdminDto } from './dto/update-admin.dto';

@ApiTags('Admin')
@Controller('admin')
@UseFilters(HttpExceptionFilter)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(AdminGuard)
  @Patch('businesses/:id/approve')
  @ApiOperation({ summary: 'Approve business form' })
  async approveBusiness(@Param('id') id: string) {
    return this.adminService.approveBusiness(id);
  }

  @UseGuards(AdminGuard)
  @Patch('businesses/:id/reject')
  @ApiOperation({ summary: 'Reject business form' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { note: { type: 'string', example: 'Reason for rejection' } },
      required: ['note'],
    },
  })
  async rejectBusiness(@Param('id') id: string, @Body('note') note: string) {
    return this.adminService.rejectBusiness(id, note);
  }

  // @Post()
  // create(@Body() createAdminDto: CreateAdminDto) {
  //   return this.adminService.create(createAdminDto);
  // }

  // @Get()
  // findAll() {
  //   return this.adminService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.adminService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
  //   return this.adminService.update(+id, updateAdminDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.adminService.remove(+id);
  // }
}
