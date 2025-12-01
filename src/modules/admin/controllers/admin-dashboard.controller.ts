import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminDashboardService } from '../services/admin-dashboard.service';

@ApiTags('Dashboard (Admin)')
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('/overview')
  async getOverview() {
    return this.adminDashboardService.getOverview();
  }
}
