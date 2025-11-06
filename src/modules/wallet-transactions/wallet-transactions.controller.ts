import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { WalletTransactionsService } from './wallet-transactions.service';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { WalletTransactions } from './schema/wallet-transactions.schema';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { GetWalletTransactionsQueryDto } from './dto/get-wallet-transactions-query.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';

@ApiTags('Wallet Transactions')
@Controller('wallet-transactions')
@UseGuards(AuthGuard)
@ApiBearerAuth('access-token')
export class WalletTransactionsController {
  constructor(
    private readonly walletTransactionsService: WalletTransactionsService,
  ) {}

  // GET /wallet-transactions/my
  @Get('my')
  @ApiOperation({
    summary: 'Get wallet transactions of the authenticated user',
  })
  async getMyTransactions(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetWalletTransactionsQueryDto,
  ): Promise<APIPaginatedResponseDto<WalletTransactions[]>> {
    const userId = req.user._id;
    return this.walletTransactionsService.getMyWalletTransactions(
      userId,
      query,
    );
  }

  // GET /wallet-transactions/:id
  @Get(':id')
  @ApiOperation({ summary: 'Get wallet transaction detail by ID' })
  async getTransactionDetail(
    @Param('id') id: string,
  ): Promise<APIResponseDto<WalletTransactions>> {
    return this.walletTransactionsService.getTransactionById(id);
  }
}
