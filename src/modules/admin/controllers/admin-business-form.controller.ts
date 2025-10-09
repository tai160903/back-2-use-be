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
import { UseGuards, Body, Param, Patch } from '@nestjs/common';
import { RoleCheckGuard } from '../../../common/guards/role-check.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { AdminBusinessFormService } from '../services/admin-business-form.service';
// import { CreateAdminDto } from './dto/create-admin.dto';
// import { UpdateAdminDto } from './dto/update-admin.dto';

@ApiTags('Business Form (Admin)')
@Controller('admin')
@UseFilters(HttpExceptionFilter)
@ApiBearerAuth('access-token')
@UseGuards(RoleCheckGuard.withRoles(['admin']))
export class AdminBusinessFormController {
  constructor(private readonly adminService: AdminBusinessFormService) {}

  @Patch('businesses/:id/approve')
  @ApiOperation({ summary: 'Approve business form' })
  async approveBusiness(@Param('id') id: string) {
    return this.adminService.approveBusiness(id);
  }

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
