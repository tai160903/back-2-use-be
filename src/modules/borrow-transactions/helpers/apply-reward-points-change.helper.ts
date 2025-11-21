export function applyRewardPointChange(
  customer,
  borrowTransactionStatus,
  rewardPolicy,
) {
  let addedRewardPoints = 0;
  let addedRankingPoints = 0;

  if (borrowTransactionStatus === 'returned') {
    addedRewardPoints = rewardPolicy.rewardSuccess;
    addedRankingPoints = rewardPolicy.rankingSuccess;

    customer.rewardPoints += addedRewardPoints;
    customer.rankingPoints += addedRankingPoints;
    customer.returnSuccessCount += 1;
  } else if (borrowTransactionStatus === 'rejected') {
    addedRewardPoints = rewardPolicy.rewardFailed;
    addedRankingPoints = rewardPolicy.rankingFailedPenalty;

    customer.rewardPoints += addedRewardPoints;
    customer.rankingPoints += addedRankingPoints;
    customer.returnFailedCount += 1;
  }

  return { addedRewardPoints, addedRankingPoints };
}
