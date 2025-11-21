import { TransactionType } from 'src/common/constants/transaction-type.enum';

export async function handleForfeit(
  transaction,
  businessWallet,
  session,
  walletTransactionsModel,
) {
  const deposit = transaction.depositAmount;

  businessWallet.holdingBalance -= deposit;
  businessWallet.availableBalance += deposit;

  await new walletTransactionsModel({
    walletId: businessWallet._id,
    relatedUserId: transaction.customerId,
    relatedUserType: 'customer',
    amount: deposit,
    transactionType: TransactionType.DEPOSIT_FORFEITED,
    direction: 'in',
    balanceType: 'holding',
    toBalanceType: 'available',
    description: 'Deposit forfeited due to damaged product',
    status: 'completed',
    referenceType: 'borrow',
    referenceId: transaction._id,
  }).save({ session });

  await businessWallet.save({ session });
}
