export function calculateLateReturnInfo(
  transaction,
  borrowPolicy,
  now = new Date(),
) {
  //   if (!transaction || !transaction.dueDate) {
  //     return {
  //       isLate: false,
  //       lateDays: 0,
  //       lateFee: 0,
  //       finalReturnMoney: transaction?.depositAmount || 0,
  //     };
  //   }

  //   const { dueDate, depositAmount } = transaction;
  //   const { maxDaysLateAllowed, percentDepositPerDay } = borrowPolicy;

  //   // Tính số ngày trễ
  //   const msLate = now.getTime() - dueDate.getTime();
  //   const lateDays = Math.floor(msLate / (1000 * 60 * 60 * 24));

  //   // Chưa trễ
  //   if (lateDays <= 0) {
  //     return {
  //       isLate: false,
  //       lateDays: 0,
  //       lateFee: 0,
  //       finalReturnMoney: depositAmount,
  //     };
  //   }

  //   // Nếu vượt quá số ngày cho phép → mất toàn bộ deposit
  //   if (lateDays > maxDaysLateAllowed) {
  //     return {
  //       isLate: true,
  //       lateDays,
  //       lateFee: depositAmount,
  //       finalReturnMoney: 0,
  //     };
  //   }

  //   // Nếu trong mức cho phép → tính theo % deposit × số ngày
  //   const lateFee = (percentDepositPerDay / 100) * depositAmount * lateDays;

  //   const finalReturnMoney = Math.max(0, depositAmount - lateFee);

  //   return {
  //     isLate: true,
  //     lateDays,
  //     lateFee,
  //     finalReturnMoney,
  //   };

  // Test with minute
  if (!transaction || !transaction.dueDate) {
    return {
      isLate: false,
      lateDays: 0,
      lateFee: 0,
      finalReturnMoney: transaction?.depositAmount || 0,
    };
  }

  const { dueDate, depositAmount } = transaction;
  const { maxDaysLateAllowed, percentDepositPerDay } = borrowPolicy;

  // Chênh lệch theo phút
  const msLate = now.getTime() - new Date(dueDate).getTime();
  const lateDays = Math.floor(msLate / (1000 * 60));

  // Chưa trễ
  if (lateDays <= 0) {
    return {
      isLate: false,
      lateDays: 0,
      lateFee: 0,
      finalReturnMoney: depositAmount,
    };
  }

  // Trễ quá giới hạn → mất toàn bộ deposit
  if (lateDays > maxDaysLateAllowed) {
    return {
      isLate: true,
      lateDays,
      lateFee: depositAmount,
      finalReturnMoney: 0,
    };
  }

  // Trễ trong giới hạn → tính theo %
  const lateFee = (percentDepositPerDay / 100) * depositAmount * lateDays;

  const finalReturnMoney = Math.max(0, depositAmount - lateFee);

  return {
    isLate: true,
    lateDays,
    lateFee,
    finalReturnMoney,
  };
}
