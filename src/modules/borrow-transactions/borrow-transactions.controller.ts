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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { CreateBorrowTransactionDto } from './dto/create-borrow-transaction.dto';
import { BorrowTransactionsService } from './borrow-transactions.service';
import { AuthGuard } from '@nestjs/passport';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UpdateProductConditionDto } from './dto/update-product-condition.dto';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { RolesEnum } from 'src/common/constants/roles.enum';

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
    summary: 'Confirm borrow transaction',
    description:
      'Business, staff or manager confirms a pending_pickup borrow transaction (moves to borrowing).',
  })
  @ApiBearerAuth('access-token')
  @ApiParam({
    name: 'id',
    description: 'Borrow transaction ID to confirm',
    example: '6730a0f9e6b01a2e8f1c2d34',
  })
  @UseGuards(
    AuthGuard('jwt'),
    RoleCheckGuard.withRoles([
      RolesEnum.BUSINESS,
      RolesEnum.STAFF,
      RolesEnum.MANAGER,
    ]),
  )
  confirm(
    @Param('id') id: string,
    @Request() req: { user: { _id: string; role: RolesEnum } },
  ) {
    return this.borrowTransactionsService.confirmBorrowTransaction(
      req.user._id,
      id,
      req.user.role,
    );
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
  @UseGuards(
    AuthGuard('jwt'),
    RoleCheckGuard.withRoles([
      RolesEnum.BUSINESS,
      RolesEnum.STAFF,
      RolesEnum.MANAGER,
    ]),
  )
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
  @UseGuards(
    AuthGuard('jwt'),
    RoleCheckGuard.withRoles([
      RolesEnum.BUSINESS,
      RolesEnum.STAFF,
      RolesEnum.MANAGER,
    ]),
  )
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
  @UseGuards(
    AuthGuard('jwt'),
    RoleCheckGuard.withRoles([
      RolesEnum.BUSINESS,
      RolesEnum.STAFF,
      RolesEnum.MANAGER,
    ]),
  )
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
  @UseGuards(
    AuthGuard('jwt'),
    RoleCheckGuard.withRoles([
      RolesEnum.BUSINESS,
      RolesEnum.STAFF,
      RolesEnum.MANAGER,
    ]),
  )
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

  @Patch('customer/extend/:id')
  @ApiOperation({
    summary: 'Extend borrow duration (customer)',
    description:
      'Extend the borrow period with additional days. Anti-spam validations: max 3 extensions, 24h cooldown, cannot extend overdue transactions.',
  })
  @ApiBearerAuth('access-token')
  @ApiParam({
    name: 'id',
    description: 'Transaction ID to extend',
    example: '6730a0f9e6b01a2e8f1c2d34',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        additionalDays: {
          type: 'number',
          example: 7,
          minimum: 1,
          maximum: 30,
          description: 'Number of additional days to extend (1-30)',
        },
      },
      required: ['additionalDays'],
    },
  })
  @UseGuards(AuthGuard('jwt'))
  extendBorrowDuration(
    @Request() req: { user: { _id: string } },
    @Param('id') id: string,
    @Body('additionalDays') additionalDays: number,
  ) {
    return this.borrowTransactionsService.extendBorrowDuration(
      req.user._id,
      id,
      additionalDays,
    );
  }

  // POST borrow-transactions/:serialNumber/return-check
  @Post(':serialNumber/return-check')
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles([RolesEnum.BUSINESS]))
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Return condition data including note and images',
    schema: {
      type: 'object',
      properties: {
        condition: { type: 'string', enum: ['good', 'damaged'] },
        note: { type: 'string' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['condition', 'note'],
    },
  })
  @UseInterceptors(FilesInterceptor('images', 3))
  async confirmReturnCondition(
    @Param('serialNumber') serialNumber: string,
    @Body() dto: UpdateProductConditionDto,
    @UploadedFiles() images: Express.Multer.File[],
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user?._id;
    return this.borrowTransactionsService.confirmReturnCondition(
      serialNumber,
      userId,
      dto,
      images,
    );
  }
}
