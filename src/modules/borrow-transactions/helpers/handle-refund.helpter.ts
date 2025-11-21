import { TransactionType } from 'src/common/constants/transaction-type.enum';

export async function handleRefund(
  transaction,
  businessWallet,
  customerWallet,
  session,
  walletTransactionsModel,
) {
  const deposit = transaction.depositAmount;

  businessWallet.holdingBalance -= deposit;
  customerWallet.availableBalance += deposit;

  await new walletTransactionsModel({
    walletId: businessWallet._id,
    relatedUserId: transaction.customerId,
    relatedUserType: 'customer',
    amount: deposit,
    transactionType: TransactionType.RETURN_REFUND,
    direction: 'out',
    balanceType: 'holding',
    description: 'Refund deposit to customer',
    status: 'completed',
    referenceType: 'borrow',
    referenceId: transaction._id,
  }).save({ session });

  await new walletTransactionsModel({
    walletId: customerWallet._id,
    relatedUserId: transaction.businessId,
    relatedUserType: 'business',
    amount: deposit,
    transactionType: TransactionType.RETURN_REFUND,
    direction: 'in',
    balanceType: 'available',
    description: 'Deposit refunded',
    status: 'completed',
    referenceType: 'borrow',
    referenceId: transaction._id,
  }).save({ session });

  await Promise.all([
    customerWallet.save({ session }),
    businessWallet.save({ session }),
  ]);
}
