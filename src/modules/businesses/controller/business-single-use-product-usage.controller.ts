import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { BusinessSingleUseUsageService } from '../services/business-single-use-product-usage.service';
import { CreateSingleUseUsageDto } from '../dto/create-single-use-product-usage';

@ApiTags('Single Use Product Usage (Business)')
@UseGuards(
  AuthGuard,
  RoleCheckGuard.withRoles([RolesEnum.BUSINESS, RolesEnum.STAFF]),
)
@ApiBearerAuth('access-token')
@Controller('business/single-use-product-usage')
export class BusinessSingleUseUsageController {
  constructor(
    private readonly singleUseProductUsageService: BusinessSingleUseUsageService,
  ) {}

  @Post(':borrowTransactionId')
  async createSingleUseUsage(
    @Param('borrowTransactionId') borrowTransactionId: string,
    @Req() req,
    @Body() dto: CreateSingleUseUsageDto,
  ) {
    return this.singleUseProductUsageService.createUsage(
      borrowTransactionId,
      req.user?._id,
      req.user?.role,
      dto,
    );
  }
}
