import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminDashboardService } from '../services/admin-dashboard.service';
import { GetTopCustomersQueryDto } from '../dto/admin-dashboard/get-top-customers-query.dto';
import { GetTopBusinessesQueryDto } from '../dto/admin-dashboard/get-top-business-query.dto';
import { GetBorrowStatsByMonthDto } from '../dto/admin-dashboard/get-borrow-stats-query.dto';
import { GetWalletByMonthDto } from '../dto/admin-dashboard/get-wallet-transaction-query.dto';

@ApiTags('Dashboard (Admin)')
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('/overview')
  async getOverview() {
    return this.adminDashboardService.getOverview();
  }

  @Get('customer/monthly')
  async getCustomerStatsByMonth(@Query('year') year?: number) {
    return this.adminDashboardService.getCustomerStatsByMonth(
      year ? Number(year) : undefined,
    );
  }

  @Get('customer')
  async getTopCustomers(@Query() query: GetTopCustomersQueryDto) {
    return this.adminDashboardService.getTopCustomers(query);
  }

  @Get('business/monthly')
  async getBusinessStatsByMonth(@Query('year') year?: number) {
    return this.adminDashboardService.getBusinessStatsByMonth(
      year ? Number(year) : undefined,
    );
  }

  @Get('business')
  async getTopBusiness(@Query() query: GetTopBusinessesQueryDto) {
    return this.adminDashboardService.getTopBusinesses(query);
  }

  @Get('borrow-transactions/monthly')
  async getBorrowTransactionsStatsByMonth(
    @Query() query: GetBorrowStatsByMonthDto,
  ) {
    return this.adminDashboardService.getBorrowStatsByMonth(query);
  }

  @Get('wallet-transactions')
  async getWalletTransactionsOverview() {
    return this.adminDashboardService.getWalletTransactionsOverview();
  }

  @Get('wallet-transactions/by-month')
  async getWalletTransactionsByMonth(@Query() query: GetWalletByMonthDto) {
    return this.adminDashboardService.getWalletTransactionsByMonth(query);
  }
}
