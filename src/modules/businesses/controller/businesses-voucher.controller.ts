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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BusinessVoucherService } from '../services/businesses-voucher.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { ClaimVoucherDto } from '../dto/claim-voucher.dto';
import { GetVouchersQueryDto } from '../dto/get-vouchers-query.dto';
import { GetAllClaimVouchersQueryDto } from '../dto/get-all-claim-voucher.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { BusinessVouchers } from '../schemas/business-voucher.schema';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { SetupBusinessVoucherDto } from '../dto/setup-business-voucher.dto';
import { UpdateBusinessVoucherDto } from '../dto/update-business-voucher.dto';
import { UseVoucherAtStoreDto } from '../dto/use-voucher-at-store';
import { VoucherCodes } from 'src/modules/voucher-codes/schema/voucher-codes.schema';
import { GetVoucherDetailQueryDto } from '../dto/get-voucher-detail.dto';

@Controller('business-vouchers')
@UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.BUSINESS]))
@ApiBearerAuth('access-token')
@ApiTags('Voucher (Business)')
export class BusinessVoucherController {
  constructor(
    private readonly businessesVoucherService: BusinessVoucherService,
  ) {}

  // POST business-vouchers/:voucherId/claim
  @Post(':voucherId/claim')
  async claimVoucher(
    @Param('voucherId') voucherId: string,
    @Body() dto: ClaimVoucherDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<APIResponseDto<BusinessVouchers>> {
    const userId = req.user._id;
    return this.businessesVoucherService.claimVoucher(userId, voucherId, dto);
  }

  // POST business-vouchers/:businessVoucherId/setup
  @Post(':businessVoucherId/setup')
  async setupClaimedVoucher(
    @Req() req: AuthenticatedRequest,
    @Param('businessVoucherId') businessVoucherId: string,
    @Body() dto: SetupBusinessVoucherDto,
  ): Promise<APIResponseDto<BusinessVouchers>> {
    const userId = req.user._id;
    return this.businessesVoucherService.setupClaimedVoucher(
      userId,
      businessVoucherId,
      dto,
    );
  }

  // POST business-vouchers/voucher-codes/use
  @Post('voucher-codes/use')
  async useVoucherAtStore(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UseVoucherAtStoreDto,
  ): Promise<APIResponseDto<VoucherCodes>> {
    const userId = req.user._id;
    return this.businessesVoucherService.useVoucherAtStore(userId, dto);
  }

  // PATCH business-vouchers/:id
  @Patch(':businessVoucherId')
  async updateMyVoucher(
    @Req() req: AuthenticatedRequest,
    @Param('businessVoucherId') businessVoucherId: string,
    @Body() dto: UpdateBusinessVoucherDto,
  ): Promise<APIResponseDto<BusinessVouchers>> {
    const userId = req.user._id;
    return this.businessesVoucherService.updateMyVoucher(
      userId,
      businessVoucherId,
      dto,
    );
  }

  // GET business-vouchers
  @Get('')
  async getBusinessVouchers(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetVouchersQueryDto,
  ): Promise<APIPaginatedResponseDto<any>> {
    const userId = req.user._id;
    return this.businessesVoucherService.getAllForBusiness(userId, query);
  }

  // GET business-vouchers/my
  @Get('/my')
  async getMyClaimedVouchers(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetAllClaimVouchersQueryDto,
  ): Promise<APIPaginatedResponseDto<BusinessVouchers[]>> {
    const userId = req.user._id;
    return this.businessesVoucherService.getMyClaimedVouchers(userId, query);
  }

  // GET business-vouchers/:businessVoucherId/detail
  @Get(':businessVoucherId/detail')
  async getBusinessVoucherDetail(
    @Req() req: AuthenticatedRequest,
    @Param('businessVoucherId') businessVoucherId: string,
    @Query() query: GetVoucherDetailQueryDto,
  ) {
    const userId = req.user._id;
    return this.businessesVoucherService.getBusinessVoucherDetail(
      userId,
      businessVoucherId,
      query,
    );
  }

  // GET business-vouchers/voucher-codes/:voucherCodeId
  @Get('voucher-codes/:voucherCodeId')
  async getVoucherCodeDetail(
    @Param('voucherCodeId') voucherCodeId: string,
  ): Promise<APIResponseDto<VoucherCodes>> {
    return this.businessesVoucherService.getVoucherCodeDetail(voucherCodeId);
  }
}
