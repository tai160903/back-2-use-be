import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BusinessVoucherService } from '../services/businesses-voucher.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { ClaimVoucherDto } from '../dto/claim-voucher.dto';
import { GetVouchersQueryDto } from '../dto/get-vouchers-query.dto';

@Controller('business-vouchers')
@UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.BUSINESS]))
@ApiBearerAuth('access-token')
@ApiTags('Voucher (Business)')
export class BusinessVoucherController {
  constructor(
    private readonly businessesVoucherService: BusinessVoucherService,
  ) {}

  @Post(':voucherId/claim')
  async claimVoucher(
    @Param('voucherId') voucherId: string,
    @Body() dto: ClaimVoucherDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user._id;
    return this.businessesVoucherService.claimVoucher(userId, voucherId, dto);
  }

  @Get('')
  async getBusinessVouchers(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetVouchersQueryDto,
  ) {
    const userId = req.user._id;
    return this.businessesVoucherService.getAllForBusiness(userId, query);
  }
}
