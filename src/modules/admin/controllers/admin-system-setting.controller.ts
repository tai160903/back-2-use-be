import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminSystemSettingService } from '../services/admin-system-setting.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { CreateSystemSettingDto } from '../dto/admin-system-setting/create-system-setting.dto';
import { UpdateSystemSettingDto } from '../dto/admin-system-setting/update-system-setting.dto';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { PatchValueDto } from '../dto/admin-system-setting/patch-value.dto';

@ApiTags('System Setting (Admin)')
@UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.ADMIN]))
@ApiBearerAuth('access-token')
@Controller('admin/system-setting')
export class AdminSystemSettingController {
  constructor(
    private readonly systemSettingService: AdminSystemSettingService,
  ) {}

  //   POST admin/system-setting/upsert
  @Post('upsert')
  upsert(
    @Body() dto: CreateSystemSettingDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const adminId = req.user?._id;
    return this.systemSettingService.upsert(dto, adminId);
  }

  //   GET admin/system-setting
  @Get()
  getAll() {
    return this.systemSettingService.findAll();
  }

  //   GET admin/system-setting/:category/:key
  @Get(':category/:key')
  getOne(@Param('category') category: string, @Param('key') key: string) {
    return this.systemSettingService.findOne(category, key);
  }

  //   PUT admin/system-setting/:category/:key
  @Put(':category/:key')
  update(
    @Param('category') category: string,
    @Param('key') key: string,
    @Body() dto: UpdateSystemSettingDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const adminId = req.user?._id;
    return this.systemSettingService.update(category, key, dto, adminId);
  }

  //   PATCH admin/system-setting/:category/:key
  @Patch(':category/:key/value')
  patchValueField(
    @Param('category') category: string,
    @Param('key') key: string,
    @Body() dto: PatchValueDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const adminId = req.user?._id;
    return this.systemSettingService.patchValueField(
      category,
      key,
      dto,
      adminId,
    );
  }

  @Delete(':category/:key/value/:field')
  deleteValueField(
    @Param('category') category: string,
    @Param('key') key: string,
    @Param('field') field: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const adminId = req.user?._id;
    return this.systemSettingService.deleteValueField(
      category,
      key,
      field,
      adminId,
    );
  }
}
