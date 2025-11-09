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
import { CreateSystemVoucherDto } from '../dto/admin-voucher/create-voucher/create-system-voucher.dto';
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

@ApiTags('Voucher (Admin)')
@UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.ADMIN]))
@ApiBearerAuth('access-token')
@Controller('admin/vouchers')
export class AdminVoucherController {
  constructor(private readonly voucherService: AdminVoucherService) {}

  // POST admin/vouchers/system
  @Post('system')
  @ApiOperation({ summary: 'Admin create system voucher' })
  @ApiBody({ type: CreateSystemVoucherDto })
  async createSystemVoucher(
    @Body() dto: CreateSystemVoucherDto,
  ): Promise<APIResponseDto<Vouchers>> {
    return this.voucherService.createVoucher(dto);
  }

  // POST admin/vouchers/business
  @Post('business')
  @ApiOperation({ summary: 'Admin create business voucher' })
  @ApiBody({ type: CreateBusinessVoucherDto })
  async createBusinessVoucher(
    @Body() dto: CreateBusinessVoucherDto,
  ): Promise<APIResponseDto<Vouchers>> {
    return this.voucherService.createVoucher(dto);
  }

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
  @Get()
  async getAllVoucher(
    @Query() query: GetAllVouchersQueryDto,
  ): Promise<APIPaginatedResponseDto<Vouchers[]>> {
    return this.voucherService.getAllVoucher(query);
  }

  // GET /admin/vouchers/:id
  @Get(':id')
  async getVoucherById(
    @Param('id') id: string,
  ): Promise<APIResponseDto<Vouchers>> {
    return this.voucherService.getVoucherById(id);
  }

  // PATCH /admin/vouchers/:id
  // @Patch(':id')
  // @ApiBody({ type: UpdateVoucherDto })
  // async updateVoucher(
  //   @Param('id') id: string,
  //   @Body() updateDto: UpdateVoucherDto,
  // ): Promise<APIResponseDto<Vouchers>> {
  //   return this.voucherService.updateVoucher(id, updateDto);
  // }
}
