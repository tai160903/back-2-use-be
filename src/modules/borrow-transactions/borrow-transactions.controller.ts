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
  Req,
  UsePipes,
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
import {
  FileFieldsInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { ValidateDamageIssuePipe } from './pipes/validate-damage-issue.pipe';
import { CheckProductConditionDto } from './dto/check-product-condition';
import { ConfirmReturnDto } from './dto/confirm-return-condition.dto';
import { GetTransactionsDto } from './dto/get-borrow-transactions';
import { BorrowTransactionStatus } from 'src/common/constants/borrow-transaction-status.enum';
import { BorrowTransactionType } from 'src/common/constants/borrow-transaction-type.enum';

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
      'Business or staff confirms a pending_pickup borrow transaction (moves to borrowing).',
  })
  @ApiBearerAuth('access-token')
  @ApiParam({
    name: 'id',
    description: 'Borrow transaction ID to confirm',
    example: '6730a0f9e6b01a2e8f1c2d34',
  })
  @UseGuards(
    AuthGuard('jwt'),
    RoleCheckGuard.withRoles([RolesEnum.BUSINESS, RolesEnum.STAFF]),
  )
  confirm(
    @Param('id') id: string,
    @Request() req: { user: { _id: string; role: RolesEnum[] } },
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
    RoleCheckGuard.withRoles([RolesEnum.BUSINESS, RolesEnum.STAFF]),
  )
  getBusinessTransactions(
    @Request() req: { user: { _id: string; role: RolesEnum[] } },
    @Query() query: GetTransactionsDto,
  ) {
    return this.borrowTransactionsService.getBusinessTransactions(
      req.user._id,
      req.user.role,
      query,
    );
  }

  @Get('business/:businessId/all')
  @ApiOperation({ summary: 'Public - Get borrow transactions by businessId' })
  getBusinessTransactionsPublic(
    @Param('businessId') businessId: string,
    @Query() query: GetTransactionsDto,
  ) {
    return this.borrowTransactionsService.getBusinessTransactionsByBusinessId(
      businessId,
      query,
    );
  }

  // @Get('business/history')
  // @ApiOperation({ summary: 'Get borrow transaction history for business' })
  // @ApiBearerAuth('access-token')
  // @ApiQuery({ name: 'status', required: false })
  // @ApiQuery({ name: 'productName', required: false })
  // @ApiQuery({ name: 'serialNumber', required: false })
  // @ApiQuery({ name: 'borrowTransactionType', required: false })
  // @UseGuards(
  //   AuthGuard('jwt'),
  //   RoleCheckGuard.withRoles([RolesEnum.BUSINESS, RolesEnum.STAFF]),
  // )
  // getBusinessHistory(
  //   @Request() req: { user: { _id: string } },
  //   @Query('status') status?: string,
  //   @Query('productName') productName?: string,
  //   @Query('serialNumber') serialNumber?: string,
  //   @Query('borrowTransactionType') borrowTransactionType?: string,
  // ) {
  //   const q = { status, productName, serialNumber, borrowTransactionType };
  //   return this.borrowTransactionsService.getBusinessHistory(req.user._id, q);
  // }

  @Get('business/:id')
  @ApiOperation({ summary: 'Get borrow transaction detail (business)' })
  @ApiBearerAuth('access-token')
  @UseGuards(
    AuthGuard('jwt'),
    RoleCheckGuard.withRoles([RolesEnum.BUSINESS, RolesEnum.STAFF]),
  )
  getBusinessTransactionDetail(
    @Request() req: { user: { _id: string; role: RolesEnum[] } },
    @Param('id') id: string,
  ) {
    return this.borrowTransactionsService.getBusinessTransactionDetail(
      req.user._id,
      req.user.role,
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
    RoleCheckGuard.withRoles([RolesEnum.BUSINESS, RolesEnum.STAFF]),
  )
  getBusinessPendingTransactions(
    @Request() req: { user: { _id: string; role: RolesEnum[] } },
  ) {
    return this.borrowTransactionsService.getBusinessPendingTransactions(
      req.user._id,
      req.user.role,
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
    enum: BorrowTransactionStatus,
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
    enum: BorrowTransactionType,
  })
  @UseGuards(AuthGuard('jwt'))
  getCustomerHistory(
    @Request() req: { user: { _id: string } },
    @Query() query: GetTransactionsDto,
  ) {
    return this.borrowTransactionsService.getCustomerTransactionHistory(
      req.user._id,
      query,
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

  @Get('customer/:customerId/all')
  @ApiOperation({ summary: 'Public - Get borrow transactions by customerId' })
  getCustomerTransactionsPublic(
    @Param('customerId') customerId: string,
    @Query() query: GetTransactionsDto,
  ) {
    return this.borrowTransactionsService.getCustomerTransactionsByCustomerId(
      customerId,
      query,
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

  // GET borrow-transactions/damage-policy
  @Get('damage-policy')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  async getDamageIssues() {
    return this.borrowTransactionsService.getDamageIssues();
  }

  // POST borrow-transactions/:serialNumber/check
  @Post(':serialNumber/check')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CheckProductConditionDto })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @UsePipes(ValidateDamageIssuePipe)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'frontImage', maxCount: 1 },
      { name: 'backImage', maxCount: 1 },
      { name: 'leftImage', maxCount: 1 },
      { name: 'rightImage', maxCount: 1 },
      { name: 'topImage', maxCount: 1 },
      { name: 'bottomImage', maxCount: 1 },
    ]),
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        frontImage: { type: 'string', format: 'binary' },
        frontIssue: { type: 'string' },

        backImage: { type: 'string', format: 'binary' },
        backIssue: { type: 'string' },

        leftImage: { type: 'string', format: 'binary' },
        leftIssue: { type: 'string' },

        rightImage: { type: 'string', format: 'binary' },
        rightIssue: { type: 'string' },

        topImage: { type: 'string', format: 'binary' },
        topIssue: { type: 'string' },

        bottomImage: { type: 'string', format: 'binary' },
        bottomIssue: { type: 'string' },
      },
      required: [
        'frontImage',
        'frontIssue',

        'backImage',
        'backIssue',

        'leftImage',
        'leftIssue',

        'rightImage',
        'rightIssue',

        'topImage',
        'topIssue',

        'bottomImage',
        'bottomIssue',
      ],
    },
  })
  async checkReturn(
    @Param('serialNumber') serialNumber: string,
    @UploadedFiles()
    images: {
      frontImage?: Express.Multer.File[];
      backImage?: Express.Multer.File[];
      leftImage?: Express.Multer.File[];
      rightImage?: Express.Multer.File[];
      topImage?: Express.Multer.File[];
      bottomImage?: Express.Multer.File[];
    },
    @Body() dto: CheckProductConditionDto,
  ) {
    return this.borrowTransactionsService.checkReturnCondition(
      serialNumber,
      dto,
      images,
    );
  }

  // POST borrow-transactions/:serialNumber/confirm
  @Post(':serialNumber/confirm')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  async confirmReturn(
    @Param('serialNumber') serialNumber: string,
    @Req() req,
    @Body() dto: ConfirmReturnDto,
  ) {
    return this.borrowTransactionsService.confirmReturnCondition(
      serialNumber,
      req.user?._id,
      req.user?.role,
      dto,
    );
  }
}
