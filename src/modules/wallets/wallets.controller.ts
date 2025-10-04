import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseFilters,
  // Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';

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

  // @ApiOperation({ summary: 'Get all wallets' })
  // @Get()
  // findAll() {
  //   return this.walletsService.findAll();
  // }

  @ApiOperation({ summary: 'Get wallet by id' })
  @ApiParam({ name: 'id', type: String })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.walletsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update wallet' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateWalletDto })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWalletDto: UpdateWalletDto) {
    return this.walletsService.update(id, updateWalletDto);
  }

  // @ApiOperation({ summary: 'Delete wallet' })
  // @ApiParam({ name: 'id', type: String })
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.walletsService.remove(id);
  // }
}
