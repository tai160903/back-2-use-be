import { Module } from '@nestjs/common';
import { WalletTransactionsController } from './wallet-transactions.controller';
import { WalletTransactionsService } from './wallet-transactions.service';
import {
  WalletTransactions,
  WalletTransactionsSchema,
} from './schema/wallet-transactions.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallets, WalletsSchema } from '../wallets/schemas/wallets.schema';
import {
  Businesses,
  BusinessesSchema,
} from '../businesses/schemas/businesses.schema';
import { Customers, CustomersSchema } from '../users/schemas/customer.schema';
import {
  BusinessSubscriptions,
  BusinessSubscriptionsSchema,
} from '../businesses/schemas/business-subscriptions.schema';
import {
  BorrowTransaction,
  BorrowTransactionSchema,
} from '../borrow-transactions/schemas/borrow-transactions.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import {
  ProductGroup,
  ProductGroupSchema,
} from '../product-groups/schemas/product-group.schema';
import {
  ProductSize,
  ProductSizeSchema,
} from '../product-sizes/schemas/product-size.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WalletTransactions.name, schema: WalletTransactionsSchema },
      { name: Wallets.name, schema: WalletsSchema },
      { name: Businesses.name, schema: BusinessesSchema },
      { name: Customers.name, schema: CustomersSchema },
      { name: BusinessSubscriptions.name, schema: BusinessSubscriptionsSchema },
      { name: BorrowTransaction.name, schema: BorrowTransactionSchema },
      { name: Product.name, schema: ProductSchema },
      { name: ProductGroup.name, schema: ProductGroupSchema },
      { name: ProductSize.name, schema: ProductSizeSchema },
    ]),
  ],
  controllers: [WalletTransactionsController],
  providers: [WalletTransactionsService],
})
export class WalletTransactionsModule {}
