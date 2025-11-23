import { TransactionType } from 'src/common/constants/transaction-type.enum';

export async function handlePartialRefund(
  transaction,
  businessWallet,
  customerWallet,
  session,
  walletTransactionsModel,
  lateFee, // số tiền business được giữ lại
) {
  const deposit = transaction.depositAmount;
  const refundAmount = deposit - lateFee;

  // Business giữ lateFee → moved to availableBalance
  businessWallet.holdingBalance -= deposit;
  businessWallet.availableBalance += lateFee;

  // Customer nhận lại phần còn lại
  customerWallet.availableBalance += refundAmount;

  // Transaction for business (late fee income)
  await new walletTransactionsModel({
    walletId: businessWallet._id,
    relatedUserId: transaction.customerId,
    relatedUserType: 'customer',
    amount: lateFee,
    transactionType: TransactionType.PENALTY,
    direction: 'in',
    balanceType: 'holding',
    toBalanceType: 'available',
    description: 'Late return fee collected',
    status: 'completed',
    referenceType: 'borrow',
    referenceId: transaction._id,
  }).save({ session });

  // Transaction for customer refund
  await new walletTransactionsModel({
    walletId: customerWallet._id,
    relatedUserId: transaction.businessId,
    relatedUserType: 'business',
    amount: refundAmount,
    transactionType: TransactionType.PENALTY,
    direction: 'in',
    balanceType: 'available',
    description: 'Partial deposit refunded after late return',
    status: 'completed',
    referenceType: 'borrow',
    referenceId: transaction._id,
  }).save({ session });

  await Promise.all([
    customerWallet.save({ session }),
    businessWallet.save({ session }),
  ]);
}
