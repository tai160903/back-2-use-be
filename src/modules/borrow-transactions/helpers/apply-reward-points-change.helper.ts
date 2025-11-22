export function applyRewardPointChange(
  customer,
  borrowTransactionStatus,
  rewardPolicy,
) {
  let addedRewardPoints = 0;
  let addedRankingPoints = 0;

  switch (borrowTransactionStatus) {
    case 'returned':
      addedRewardPoints = rewardPolicy.rewardSuccess;
      addedRankingPoints = rewardPolicy.rankingSuccess;

      customer.rewardPoints += addedRewardPoints;
      customer.rankingPoints += addedRankingPoints;
      customer.returnSuccessCount += 1;
      break;

    case 'rejected':
    case 'lost': 
      addedRewardPoints = rewardPolicy.rewardFailed;
      addedRankingPoints = rewardPolicy.rankingFailedPenalty;

      customer.rewardPoints += addedRewardPoints;
      customer.rankingPoints += addedRankingPoints;
      customer.returnFailedCount += 1;
      break;

    default:
      break;
  }

  return { addedRewardPoints, addedRankingPoints };
}
