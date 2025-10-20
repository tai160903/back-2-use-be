import { HttpStatus, HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  WalletTransactions,
  WalletTransactionsDocument,
} from './schema/wallet-transactions.schema';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import {
  GetWalletTransactionsQueryDto,
  TransactionFilterGroup,
} from './dto/get-wallet-transactions-query.dto';
import { paginate } from 'src/common/utils/pagination.util';

@Injectable()
export class WalletTransactionsService {
  constructor(
    @InjectModel(WalletTransactions.name)
    private readonly walletTransactionsModel: Model<WalletTransactionsDocument>,
  ) {}

  // Get wallet transactions by userId
  async getMyWalletTransactions(
    userId: string,
    query: GetWalletTransactionsQueryDto,
  ): Promise<APIPaginatedResponseDto<WalletTransactions[]>> {
    const { direction, typeGroup, page = 1, limit = 10 } = query;

    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const filter: any = {
      userId: new Types.ObjectId(userId),
    };

    if (direction) {
      filter.direction = direction;
    }

    if (typeGroup === TransactionFilterGroup.PERSONAL) {
      filter.transactionType = {
        $in: ['deposit', 'withdraw', 'subscription_fee'],
      };
    } else if (typeGroup === TransactionFilterGroup.DEPOSIT_REFUND) {
      filter.transactionType = { $in: ['borrow_deposit', 'return_refund'] };
    }

    const { data, total, currentPage, totalPages } =
      await paginate<WalletTransactionsDocument>(
        this.walletTransactionsModel,
        filter,
        page,
        limit,
      );

    return {
      statusCode: HttpStatus.OK,
      message: 'Get wallet transactions successfully',
      data,
      total,
      currentPage,
      totalPages,
    };
  }
}
