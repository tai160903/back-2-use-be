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
    enum: ['borrow', 'return'],
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
}
