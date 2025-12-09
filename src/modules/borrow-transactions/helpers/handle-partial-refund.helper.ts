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
  // await new walletTransactionsModel({
  //   walletId: businessWallet._id,
  //   relatedUserId: transaction.customerId,
  //   relatedUserType: 'customer',
  //   amount: lateFee,
  //   transactionType: TransactionType.PENALTY,
  //   direction: 'in',
  //   balanceType: 'holding',
  //   toBalanceType: 'available',
  //   description: 'Late return fee collected',
  //   status: 'completed',
  //   referenceType: 'borrow',
  //   referenceId: transaction._id,
  // }).save({ session });
  await walletTransactionsModel.create(
    [
      // A. Business takes penalty fee
      {
        walletId: businessWallet._id,
        relatedUserId: transaction.customerId,
        relatedUserType: 'customer',
        amount: lateFee,
        transactionType: TransactionType.PENALTY,
        direction: 'in',
        balanceType: 'holding',
        toBalanceType: 'available', // reduce holding, increase available
        description: 'Late return fee collected',
        status: 'completed',
        referenceType: 'borrow',
        referenceId: transaction._id,
      },

      // B. Customer receives partial refund
      {
        walletId: businessWallet._id,
        relatedUserId: transaction.customerId,
        relatedUserType: 'customer',
        amount: refundAmount,
        transactionType: TransactionType.RETURN_REFUND,
        direction: 'out',
        balanceType: 'holding',
        toBalanceType: null,
        description: 'Partial deposit refund after late return',
        status: 'completed',
        referenceType: 'borrow',
        referenceId: transaction._id,
      },
    ],
    { session, ordered: true },
  );

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
