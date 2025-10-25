import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseFilters,
  Req,
  UseGuards,
  // Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';

@ApiTags('Wallets')
@Controller('wallets')
@UseFilters(HttpExceptionFilter)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @ApiOperation({ summary: 'Create wallet' })
  @ApiBody({ type: CreateWalletDto, required: true })
  @Post()
  create(@Body() createWalletDto: CreateWalletDto) {
    return this.walletsService.create(createWalletDto);
  }

  @ApiOperation({ summary: 'Get wallet by id' })
  @ApiParam({ name: 'walletId', type: String })
  @Get(':walletId')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Param('walletId') walletId: string) {
    return this.walletsService.findOne(walletId);
  }

  @ApiOperation({ summary: 'Update wallet' })
  @ApiParam({ name: 'walletId', type: String })
  @ApiBody({ type: UpdateWalletDto })
  @Patch(':walletId')
  update(
    @Param('walletId') walletId: string,
    @Body() updateWalletDto: UpdateWalletDto,
  ) {
    return this.walletsService.update(walletId, updateWalletDto);
  }

  @ApiOperation({ summary: 'Deposit money into wallet (via VNPAY)' })
  @ApiParam({ name: 'walletId', type: String })
  @ApiBody({ schema: { properties: { amount: { type: 'number' } } } })
  @ApiBearerAuth('access-token')
  @Post(':walletId/deposit')
  @UseGuards(AuthGuard('jwt'))
  async deposit(
    @Param('walletId') walletId: string,
    @Body('amount') amount: number,
    @Req() req,
  ) {
    return this.walletsService.deposit(walletId, amount, req);
  }

  @ApiOperation({ summary: 'Withdraw money from wallet (decrease balance)' })
  @ApiParam({ name: 'walletId', type: String })
  @ApiBody({ schema: { properties: { amount: { type: 'number' } } } })
  @ApiBearerAuth('access-token')
  @Post(':walletId/withdraw')
  @UseGuards(AuthGuard('jwt'))
  async withdraw(
    @Param('walletId') walletId: string,
    @Body('amount') amount: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?._id;
    return this.walletsService.withdraw(walletId, amount, userId);
  }
}
