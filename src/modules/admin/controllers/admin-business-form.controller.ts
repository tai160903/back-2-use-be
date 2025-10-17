import { Controller, Get, Query, UseFilters } from '@nestjs/common';
import { UseGuards, Body, Param, Patch } from '@nestjs/common';
import { RoleCheckGuard } from '../../../common/guards/role-check.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { AdminBusinessFormService } from '../services/admin-business-form.service';

@ApiTags('Business Form (Admin)')
@Controller('admin')
@UseFilters(HttpExceptionFilter)
@ApiBearerAuth('access-token')
export class AdminBusinessFormController {
  constructor(private readonly adminService: AdminBusinessFormService) {}

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
    return this.adminService.getAllForms(page ?? 1, limit ?? 10, status ?? '');
  }

  @ApiOperation({ summary: 'Get business form detail by id' })
  @ApiParam({ name: 'id', required: true, type: String, example: '652f1a...' })
  @ApiBearerAuth('access-token')
  @UseGuards(RoleCheckGuard.withRoles(['admin', 'business']))
  @Get('form/detail/:id')
  async getFormDetail(@Param('id') id: string) {
    return this.adminService.getFormDetail(id);
  }

  @Patch('businesses/:id/approve')
  @ApiOperation({ summary: 'Approve business form' })
  @UseGuards(RoleCheckGuard.withRoles(['admin']))
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
  @UseGuards(RoleCheckGuard.withRoles(['admin']))
  async rejectBusiness(@Param('id') id: string, @Body('note') note: string) {
    return this.adminService.rejectBusiness(id, note);
  }
}
