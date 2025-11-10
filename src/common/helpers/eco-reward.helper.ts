import { EcoRewardPolicyDocument } from 'src/modules/eco-reward-policies/schemas/eco-reward-policy.schema';

export function getBusinessCurrentTier(
  ecoPoints: number,
  policies: EcoRewardPolicyDocument[],
) {
  if (!policies || policies.length === 0) {
    return null;
  }

  let currentTier = policies[0];
  for (const policy of policies) {
    if (ecoPoints >= policy.threshold) {
      currentTier = policy;
    }
  }

  return currentTier;
}
