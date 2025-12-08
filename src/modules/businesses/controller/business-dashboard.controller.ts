import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { BusinessDashboardService } from '../services/business-dashboard.service';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { GetBorrowStatsByMonthDto } from 'src/modules/admin/dto/admin-dashboard/get-borrow-stats-query.dto';

@ApiTags('Dashboard (Business)')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.BUSINESS]))
@Controller('business/dashboard')
export class BusinessDashboardController {
  constructor(
    private readonly businessDashboardService: BusinessDashboardService,
  ) {}

  @Get('overview')
  async getOverview(@Req() req: AuthenticatedRequest) {
    const userId = req.user?._id;
    return this.businessDashboardService.getBusinessOverview(userId);
  }

  @Get('top-borrowed')
  async getTopProductBorrowed(
    @Req() req: AuthenticatedRequest,
    @Query('top') top: number,
  ) {
    const userId = req.user?._id;
    return this.businessDashboardService.getBusinessTopProduct(userId, top);
  }

  @Get('borrow-transactions/monthly')
  async getBorrowTransactionsStatsByMonth(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetBorrowStatsByMonthDto,
  ) {
    const userId = req.user?._id;
    return this.businessDashboardService.getBusinessBorrowStatsByMonth(
      userId,
      query,
    );
  }

  @Get('wallet-transactions/monthly')
  async getWalletTransactionsStatsByMonth(
    @Req() req: AuthenticatedRequest,
    @Query('year') year?: number,
  ) {
    const userId = req.user?._id;
    return this.businessDashboardService.getBusinessWalletStatsByMonth(
      userId,
      year,
    );
  }
}
