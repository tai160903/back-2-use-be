import {
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
  Get,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateBorrowTransactionDto } from './dto/create-borrow-transaction.dto';
import { BorrowTransactionsService } from './borrow-transactions.service';
import { AuthGuard } from '@nestjs/passport';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';

@ApiTags('Borrow Transactions')
@Controller('borrow-transactions')
export class BorrowTransactionsController {
  constructor(
    private readonly borrowTransactionsService: BorrowTransactionsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a borrow transaction',
    description:
      'Creates a new borrow transaction for a user with the provided details.',
  })
  @ApiBearerAuth('access-token')
  @ApiBody({
    type: CreateBorrowTransactionDto,
    description: 'Details required to create a borrow transaction.',
  })
  @UseGuards(AuthGuard('jwt'))
  create(
    @Body() createBorrowTransactionDto: CreateBorrowTransactionDto,
    @Request() req: { user: { _id: string } },
  ) {
    return this.borrowTransactionsService.createBorrowTransaction(
      createBorrowTransactionDto,
      req.user._id,
    );
  }
  @Patch('confirm/:id')
  @ApiOperation({
    summary: 'Confirm a borrow transaction',
    description: 'Confirms a borrow transaction by updating its status.',
  })
  @ApiBearerAuth('access-token')
  @ApiParam({
    name: 'id',
    description: 'The ID of the borrow transaction to confirm.',
    example: '6730a0f9e6b01a2e8f1c2d34',
  })
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles(['business']))
  confirm(@Param('id') id: string) {
    return this.borrowTransactionsService.confirmBorrowTransaction(id);
  }

  @Get('business')
  @ApiOperation({ summary: 'Get all borrow transactions for business' })
  @ApiBearerAuth('access-token')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'productName', required: false })
  @ApiQuery({ name: 'serialNumber', required: false })
  @ApiQuery({ name: 'borrowTransactionType', required: false })
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles(['business']))
  getBusinessTransactions(
    @Request() req: { user: { _id: string } },
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('status') status?: string,
    @Query('productName') productName?: string,
    @Query('serialNumber') serialNumber?: string,
    @Query('borrowTransactionType') borrowTransactionType?: string,
  ) {
    const q = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      status,
      productName,
      serialNumber,
      borrowTransactionType,
    };
    return this.borrowTransactionsService.getBusinessTransactions(
      req.user._id,
      q,
    );
  }

  @Get('business/history')
  @ApiOperation({ summary: 'Get borrow transaction history for business' })
  @ApiBearerAuth('access-token')
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'productName', required: false })
  @ApiQuery({ name: 'serialNumber', required: false })
  @ApiQuery({ name: 'borrowTransactionType', required: false })
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles(['business']))
  getBusinessHistory(
    @Request() req: { user: { _id: string } },
    @Query('status') status?: string,
    @Query('productName') productName?: string,
    @Query('serialNumber') serialNumber?: string,
    @Query('borrowTransactionType') borrowTransactionType?: string,
  ) {
    const q = { status, productName, serialNumber, borrowTransactionType };
    return this.borrowTransactionsService.getBusinessHistory(req.user._id, q);
  }

  @Get('business/:id')
  @ApiOperation({ summary: 'Get borrow transaction detail (business)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles(['business']))
  getBusinessTransactionDetail(
    @Request() req: { user: { _id: string } },
    @Param('id') id: string,
  ) {
    return this.borrowTransactionsService.getBusinessTransactionDetail(
      req.user._id,
      id,
    );
  }

  @Get('business-pending')
  @ApiOperation({
    summary: 'Get pending transactions for a business',
    description: 'Fetches all pending transactions for a specific business.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles(['business']))
  getBusinessPendingTransactions(@Request() req: { user: { _id: string } }) {
    return this.borrowTransactionsService.getBusinessPendingTransactions(
      req.user._id,
    );
  }

  @Get('customer-history')
  @ApiOperation({
    summary: 'Get transaction history for a customer',
    description: 'Fetches the transaction history for a specific customer.',
  })
  @ApiBearerAuth('access-token')
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by transaction status.',
    enum: [
      'pending_pickup',
      'borrowing',
      'returned',
      'return_late',
      'rejected',
      'lost',
      'canceled',
    ],
  })
  @ApiQuery({
    name: 'productName',
    required: false,
    description: 'Search by product name (case-insensitive, partial match)',
  })
  @ApiQuery({
    name: 'borrowTransactionType',
    required: false,
    description: 'Filter by borrowTransactionType',
    enum: ['borrow', 'return_success', 'return_failed'],
  })
  @UseGuards(AuthGuard('jwt'))
  getCustomerHistory(
    @Request() req: { user: { _id: string } },
    @Query('status') status?: string,
    @Query('productName') productName?: string,
    @Query('borrowTransactionType') borrowTransactionType?: string,
  ) {
    return this.borrowTransactionsService.getCustomerTransactionHistory(
      req.user._id,
      { status, productName, borrowTransactionType },
    );
  }

  @Get('customer/:id')
  @ApiOperation({ summary: 'Get borrow transaction detail (customer)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  getCustomerTransactionDetail(
    @Request() req: { user: { _id: string } },
    @Param('id') id: string,
  ) {
    return this.borrowTransactionsService.getCustomerTransactionDetail(
      req.user._id,
      id,
    );
  }

  @Patch('customer/cancel/:id')
  @ApiOperation({ summary: 'Cancel a pending borrow transaction (customer)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  cancelCustomerPending(
    @Request() req: { user: { _id: string } },
    @Param('id') id: string,
  ) {
    return this.borrowTransactionsService.cancelCustomerPendingTransaction(
      req.user._id,
      id,
    );
  }
}
