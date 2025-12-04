import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { BusinessDashboardService } from '../services/business-dashboard.service';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';

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
}
