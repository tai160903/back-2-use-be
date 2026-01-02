import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { GetSingleUseUsageQueryDto } from './dto/get-single-use-product-usage.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { SingleUseProductUsageService } from './single-use-product-usage.service';

@ApiTags('Single Use Product Usage')
@UseGuards(AuthGuard)
@ApiBearerAuth('access-token')
@Controller('single-use-product-usage')
export class SingleUseProductUsageController {
  constructor(
    private readonly singleUseProductUsageService: SingleUseProductUsageService,
  ) {}

  @Get(':borrowTransactionId')
  getSingleUseUsages(
    @Param('borrowTransactionId') borrowTransactionId: string,
    @Query() query: GetSingleUseUsageQueryDto,
  ): Promise<APIPaginatedResponseDto<any[]>> {
    return this.singleUseProductUsageService.getUsagesByBorrowTransaction(
      borrowTransactionId,
      query,
    );
  }
}
