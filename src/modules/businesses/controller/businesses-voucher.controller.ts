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

  // POST business-vouchers/:id/setup
  @Post(':id/setup')
  async setupClaimedVoucher(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SetupBusinessVoucherDto,
  ) {
    const userId = req.user._id;
    return this.businessesVoucherService.setupClaimedVoucher(userId, id, dto);
  }

  // PATCH business-vouchers/:id
  @Patch(':id')
  async updateMyVoucher(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateBusinessVoucherDto,
  ) {
    const userId = req.user._id;
    return this.businessesVoucherService.updateMyVoucher(userId, id, dto);
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
}
