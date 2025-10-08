import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseFilters,
  Req,
  // Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { VnpayService } from '../vnpay/vnpay.service';

@ApiTags('Wallets')
@Controller('wallets')
@UseFilters(HttpExceptionFilter)
export class WalletsController {
  constructor(
    private readonly walletsService: WalletsService,
    private readonly vnpayService: VnpayService,
  ) {}

  @ApiOperation({ summary: 'Create wallet' })
  @ApiBody({ type: CreateWalletDto, required: true })
  @Post()
  create(@Body() createWalletDto: CreateWalletDto) {
    return this.walletsService.create(createWalletDto);
  }

  @ApiOperation({ summary: 'Get wallet by id' })
  @ApiParam({ name: 'walletId', type: String })
  @Get(':walletId')
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
  @Post(':walletId/deposit')
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
  @Post(':walletId/withdraw')
  async withdraw(
    @Param('walletId') walletId: string,
    @Body('amount') amount: number,
  ) {
    return this.walletsService.withdraw(walletId, amount);
  }
}
