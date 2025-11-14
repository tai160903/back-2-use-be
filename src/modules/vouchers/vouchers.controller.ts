import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { VoucherCodes } from '../voucher-codes/schema/voucher-codes.schema';
import { Vouchers } from './schema/vouchers.schema';
import { RedeemVoucherDto } from './dto/redeem-voucher.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { GetAllVouchersQueryDto } from './dto/get-all-active-voucher.dto';
import { BusinessVouchers } from '../businesses/schemas/business-voucher.schema';
import { GetMyVouchersQueryDto } from './dto/get-my-voucher-query.dto';

@ApiTags('Voucher (Customer)')
@Controller('customer/vouchers')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.CUSTOMER]))
export class VouchersController {
  constructor(private readonly voucherService: VouchersService) {}

  @Post('redeem')
  async redeemVoucher(
    @Body() redeemVoucherDto: RedeemVoucherDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<APIResponseDto<VoucherCodes>> {
    const userId = req.user?._id;
    return this.voucherService.redeemVoucher(userId, redeemVoucherDto);
  }

  @Get('')
  async getAllVouchers(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetAllVouchersQueryDto,
  ): Promise<APIPaginatedResponseDto<BusinessVouchers[]>> {
    const userId = req.user._id;
    return this.voucherService.getAllVouchers(userId, query);
  }

  @Get('my')
  async getMyVouchers(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetMyVouchersQueryDto,
  ) {
    const userId = req.user._id;
    return this.voucherService.getMyVouchers(userId, query);
  }
}
