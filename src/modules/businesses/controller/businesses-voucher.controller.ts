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
import { BusinessCreateVoucherDto } from '../dto/business-create-voucher';

@Controller('business-vouchers')
@ApiBearerAuth('access-token')
@ApiTags('Voucher (Business)')
export class BusinessVoucherController {
  constructor(
    private readonly businessesVoucherService: BusinessVoucherService,
  ) {}

  // POST business-vouchers
  @UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.BUSINESS]))
  @Post('')
  async createBusinessVoucher(
    @Body() dto: BusinessCreateVoucherDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<APIResponseDto<BusinessVouchers>> {
    const userId = req.user._id;
    return this.businessesVoucherService.createBusinessVoucher(userId, dto);
  }

  // POST business-vouchers/:voucherId/claim
  // @Post(':voucherId/claim')
  // async claimVoucher(
  //   @Param('voucherId') voucherId: string,
  //   @Body() dto: ClaimVoucherDto,
  //   @Req() req: AuthenticatedRequest,
  // ): Promise<APIResponseDto<BusinessVouchers>> {
  //   const userId = req.user._id;
  //   return this.businessesVoucherService.claimVoucher(userId, voucherId, dto);
  // }

  // POST business-vouchers/:businessVoucherId/setup
  // @Post(':businessVoucherId/setup')
  // async setupClaimedVoucher(
  //   @Req() req: AuthenticatedRequest,
  //   @Param('businessVoucherId') businessVoucherId: string,
  //   @Body() dto: SetupBusinessVoucherDto,
  // ): Promise<APIResponseDto<BusinessVouchers>> {
  //   const userId = req.user._id;
  //   return this.businessesVoucherService.setupClaimedVoucher(
  //     userId,
  //     businessVoucherId,
  //     dto,
  //   );
  // }

  // POST business-vouchers/voucher-codes/use
  @UseGuards(
    AuthGuard,
    RoleCheckGuard.withRoles([RolesEnum.BUSINESS, RolesEnum.STAFF]),
  )
  @Post('voucher-codes/use')
  async useVoucherAtStore(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UseVoucherAtStoreDto,
  ): Promise<APIResponseDto<VoucherCodes>> {
    const userId = req.user?._id;
    interface RequestUser {
      _id: string;
      role?: RolesEnum;
    }

    const user = req.user as RequestUser | undefined;
    const role: RolesEnum[] = user?.role ? [user.role] : [];
    return this.businessesVoucherService.useVoucherAtStore(userId, role, dto);
  }

  // PATCH business-vouchers/:id
  @UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.BUSINESS]))
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
  // @Get('')
  // async getBusinessVouchers(
  //   @Req() req: AuthenticatedRequest,
  //   @Query() query: GetVouchersQueryDto,
  // ): Promise<APIPaginatedResponseDto<any>> {
  //   const userId = req.user._id;
  //   return this.businessesVoucherService.getAllForBusiness(userId, query);
  // }

  // GET business-vouchers/my
  @Get('/my')
  @UseGuards(
    AuthGuard,
    RoleCheckGuard.withRoles([RolesEnum.BUSINESS, RolesEnum.STAFF]),
  )
  async getMyVouchers(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetAllClaimVouchersQueryDto,
  ): Promise<APIPaginatedResponseDto<BusinessVouchers[]>> {
    const userId = req.user?._id;
    const role: RolesEnum[] = req.user?.role
      ? [req.user.role as RolesEnum]
      : [];
    return this.businessesVoucherService.getMyClaimedVouchers(
      userId,
      role,
      query,
    );
  }

  // GET business-vouchers/:businessVoucherId/voucher-codes
  @UseGuards(
    AuthGuard,
    RoleCheckGuard.withRoles([RolesEnum.BUSINESS, RolesEnum.STAFF]),
  )
  @Get(':businessVoucherId/voucher-codes')
  async getBusinessVoucherDetail(
    @Req() req: AuthenticatedRequest,
    @Param('businessVoucherId') businessVoucherId: string,
    @Query() query: GetVoucherDetailQueryDto,
  ) {
    const userId = req.user?._id;
    const role: RolesEnum[] = req.user?.role
      ? [req.user.role as RolesEnum]
      : [];
    return this.businessesVoucherService.getBusinessVoucherDetail(
      userId,
      role,
      businessVoucherId,
      query,
    );
  }

  // GET business-vouchers/voucher-codes/:voucherCodeId
  @UseGuards(
    AuthGuard,
    RoleCheckGuard.withRoles([RolesEnum.BUSINESS, RolesEnum.STAFF]),
  )
  @Get('voucher-codes/:voucherCodeId')
  async getVoucherCodeDetail(
    @Param('voucherCodeId') voucherCodeId: string,
  ): Promise<APIResponseDto<VoucherCodes>> {
    return this.businessesVoucherService.getVoucherCodeDetail(voucherCodeId);
  }
}
