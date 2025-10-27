import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AdminVoucherService } from '../services/admin-voucher.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { CreateVoucherDto } from '../dto/admin-voucher/create-voucher.dto';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { Vouchers } from 'src/modules/vouchers/schema/vouchers.schema';

@ApiTags('Voucher (Admin)')
@UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.ADMIN]))
@ApiBearerAuth('access-token')
@Controller('admin/vouchers')
export class AdminVoucherController {
  constructor(private readonly voucherService: AdminVoucherService) {}

  // POST /admin/vouchers
  @Post()
  async createVoucher(
    @Body() createVoucherDto: CreateVoucherDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<APIResponseDto<Vouchers>> {
    const adminId = req.user?._id;
    return this.voucherService.createVoucher(createVoucherDto, adminId);
  }
}
