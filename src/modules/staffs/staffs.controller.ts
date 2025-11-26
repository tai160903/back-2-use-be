import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { StaffsService } from './staffs.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { AuthGuard } from '@nestjs/passport';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { RolesEnum } from 'src/common/constants/roles.enum';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Staffs')
@Controller('staffs')
export class StaffsController {
  constructor(private readonly staffsService: StaffsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create staff',
    description: 'Business creates a staff record (default active status).',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles([RolesEnum.BUSINESS]))
  create(
    @Body() dto: CreateStaffDto,
    @Request() req: { user: { _id: string } },
  ) {
    return this.staffsService.createStaff(dto, req.user._id);
  }

  @Get()
  @ApiOperation({
    summary: 'List staffs',
    description: 'Paginated staff listing for a business.',
  })
  @ApiBearerAuth('access-token')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'removed'],
  })
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles([RolesEnum.BUSINESS]))
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    return this.staffsService.findAllStaffs(req!.user._id, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      search,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get staff detail',
    description: 'Fetch a single staff of the business.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles([RolesEnum.BUSINESS]))
  findOne(@Param('id') id: string, @Request() req: { user: { _id: string } }) {
    return this.staffsService.findOneStaff(req.user._id, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update staff',
    description:
      'Update staff properties (email, phone, position, status, staffRole).',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles([RolesEnum.BUSINESS]))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
    @Request() req: { user: { _id: string } },
  ) {
    return this.staffsService.updateStaff(req.user._id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove staff',
    description: 'Soft remove staff (set status removed).',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles([RolesEnum.BUSINESS]))
  remove(@Param('id') id: string, @Request() req: { user: { _id: string } }) {
    return this.staffsService.removeStaff(req.user._id, id);
  }
}
