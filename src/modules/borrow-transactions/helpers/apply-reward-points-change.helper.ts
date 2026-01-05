export function applyRewardPointChange(
  customer,
  business,
  borrowTransactionStatus,
  rewardPolicy,
) {
  let addedRewardPoints = 0;
  let addedRankingPoints = 0;

  // ===============================
  // 1️⃣ DETERMINE POINTS BY STATUS
  // ===============================
  switch (borrowTransactionStatus) {
    case 'returned':
      addedRewardPoints = rewardPolicy.rewardSuccess;
      addedRankingPoints = rewardPolicy.rankingSuccess;
      customer.returnSuccessCount += 1;
      break;

    case 'return_late':
      addedRewardPoints = rewardPolicy.rewardLate;
      addedRankingPoints = rewardPolicy.rankingLate;
      customer.returnSuccessCount += 1;
      break;

    case 'rejected':
    case 'lost':
      addedRewardPoints = rewardPolicy.rewardFailed; // usually 0
      addedRankingPoints = rewardPolicy.rankingFailedPenalty;
      customer.returnFailedCount += 1;
      break;

    default:
      return {
        addedRewardPoints: 0,
        addedRankingPoints: 0,
      };
  }

  // ===============================
  // 2️⃣ HANDLE REWARD POOL (BUSINESS)
  // ===============================
  if (addedRewardPoints > 0) {
    if (business.rewardPoints >= addedRewardPoints) {
      // ✅ Business đủ điểm → cấp thưởng
      business.rewardPoints -= addedRewardPoints;
      customer.rewardPoints += addedRewardPoints;
    } else {
      // 🚫 Business hết điểm → không thưởng
      addedRewardPoints = 0;
    }
  }

  // ===============================
  // 3️⃣ APPLY RANKING POINTS (ALWAYS)
  // ===============================
  customer.rankingPoints += addedRankingPoints;

  return {
    addedRewardPoints,
    addedRankingPoints,
  };
}
