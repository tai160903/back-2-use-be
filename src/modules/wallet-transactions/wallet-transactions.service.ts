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
import { APIResponseDto } from 'src/common/dtos/api-response.dto';

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
    const { direction, typeGroup, page = 1, limit = 10, walletType } = query;

    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const filter: any = {
      relatedUserId: new Types.ObjectId(userId),
    };

    if (walletType) {
      filter.relatedUserType = walletType;
    }

    if (direction) {
      filter.direction = direction;
    }

    switch (typeGroup) {
      case TransactionFilterGroup.PERSONAL:
        filter.transactionType = {
          $in: ['top_up', 'withdraw', 'subscription_fee'],
        };
        break;
      case TransactionFilterGroup.DEPOSIT_REFUND:
        filter.transactionType = { $in: ['borrow_deposit', 'return_refund'] };
        break;
      case TransactionFilterGroup.PENALTY:
        filter.transactionType = 'penalty';
        break;
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
      message: `Get ${walletType}'s wallet transactions successfully`,
      data,
      total,
      currentPage,
      totalPages,
    };
  }

  // Get detail transaction by id
  async getTransactionById(
    id: string,
  ): Promise<APIResponseDto<WalletTransactions>> {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid transaction ID', HttpStatus.BAD_REQUEST);
    }

    const transaction = await this.walletTransactionsModel.findById(id);
    if (!transaction) {
      throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Get transaction detail successfully',
      data: transaction,
    };
  }
}
