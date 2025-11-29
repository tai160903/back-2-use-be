import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminVoucherService } from '../services/admin-voucher.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { Vouchers } from 'src/modules/vouchers/schema/vouchers.schema';
import { GetAllVouchersQueryDto } from '../dto/admin-voucher/get-all-vouchers.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { VoucherCodeStatus } from 'src/common/constants/voucher-codes-status.enum';
import { GetVoucherCodesQueryDto } from '../dto/admin-voucher/get-voucher-codes-query.dto';
import { VoucherCodes } from 'src/modules/voucher-codes/schema/voucher-codes.schema';
import { CreateBusinessVoucherDto } from '../dto/admin-voucher/create-voucher/create-business-voucher.dto';
import { CreateLeaderboardVoucherDto } from '../dto/admin-voucher/create-voucher/create-leaderboard-voucher.dto';
import { CreateVoucherUnion } from '../dto/admin-voucher/create-voucher/create-voucher-union';
import { UpdateVoucherDto } from '../dto/admin-voucher/update-voucher.dto';
import { BusinessVouchers } from 'src/modules/businesses/schemas/business-voucher.schema';
import { GetBusinessVoucherByVoucherIdQueryDto } from '../dto/admin-voucher/get-business-voucher-from-vouchers-query.dto';
import { GetVoucherCodesByBusinessVoucherIdQueryDto } from '../dto/admin-voucher/get-voucher-codes-from-business-voucher-query.dto';
import { GetBusinessVouchersQueryDto } from '../dto/admin-voucher/get-all-business-voucher.dto';

@ApiTags('Voucher (Admin)')
@UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.ADMIN]))
@ApiBearerAuth('access-token')
@Controller('admin/vouchers')
export class AdminVoucherController {
  constructor(private readonly voucherService: AdminVoucherService) {}

  // POST admin/vouchers/business
  // @Post('business')
  // @ApiOperation({ summary: 'Admin create business voucher' })
  // @ApiBody({ type: CreateBusinessVoucherDto })
  // async createBusinessVoucher(
  //   @Body() dto: CreateBusinessVoucherDto,
  // ): Promise<APIResponseDto<Vouchers>> {
  //   return this.voucherService.createVoucher(dto);
  // }

  // POST admin/vouchers/leaderboard
  @Post('leaderboard')
  @ApiOperation({ summary: 'Admin create leaderboard voucher' })
  @ApiBody({ type: CreateLeaderboardVoucherDto })
  async createLeaderboardVoucher(
    @Body() dto: CreateLeaderboardVoucherDto,
  ): Promise<APIResponseDto<Vouchers>> {
    return this.voucherService.createVoucher(dto);
  }

  // GET /admin/vouchers
  @Get('leaderboard')
  async getLeaderboardVoucher(
    @Query() query: GetAllVouchersQueryDto,
  ): Promise<APIPaginatedResponseDto<Vouchers[]>> {
    return this.voucherService.getLeaderboardVoucher(query);
  }

  // GET /admin/vouchers/businessVoucher
  @Get('businessVoucher')
  async getAllBusinessVoucher(@Query() query: GetBusinessVouchersQueryDto) {
    return this.voucherService.getAllBusinessVouchers(query);
  }

  // GET /admin/vouchers/:voucherId
  @Get('leaderboard/:voucherId')
  async getVoucherById(
    @Param('voucherId') voucherId: string,
  ): Promise<APIResponseDto<Vouchers>> {
    return this.voucherService.getVoucherById(voucherId);
  }

  //  GET /admin/vouchers/:voucherId/businessVoucher
  // @Get(':voucherId/businessVoucher')
  // async getBusinessVoucherByVoucherId(
  //   @Param('voucherId') voucherId: string,
  //   @Query() query: GetBusinessVoucherByVoucherIdQueryDto,
  // ): Promise<APIPaginatedResponseDto<BusinessVouchers[]>> {
  //   return this.voucherService.getBusinessVoucherByVoucherId(voucherId, query);
  // }

  //  GET /admin/vouchers/businessVoucher/:businessVoucherId/codes
  @Get('businessVoucher/:businessVoucherId/codes')
  async getVoucherCodesByBusinessVoucherId(
    @Param('businessVoucherId') businessVoucherId: string,
    @Query() query: GetVoucherCodesByBusinessVoucherIdQueryDto,
  ): Promise<APIPaginatedResponseDto<VoucherCodes[]>> {
    return this.voucherService.getVoucherCodesByBusinessVoucherId(
      businessVoucherId,
      query,
    );
  }

  // PATCH /admin/vouchers/:voucherId
  // @Patch('businessVoucher/:voucherId/is-disabled')
  // async updateIsDisabled(
  //   @Param('voucherId') voucherId: string,
  //   @Body() dto: UpdateVoucherDto,
  // ) {
  //   return this.voucherService.updateVoucherTypeBusiness(voucherId, dto);
  // }
}
