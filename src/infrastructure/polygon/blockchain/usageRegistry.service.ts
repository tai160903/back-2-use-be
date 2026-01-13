import { ethers } from 'ethers';
import { usageRegistryContract } from './usageRegistry.contract';
import { enqueueTx } from './txQueue';

export async function recordUsageOnChain(
  usageId: string,
  businessId: string,
  co2: number,
) {
  return enqueueTx(async (nonce) => {
    console.log('🚀 recordUsageOnChain', { usageId, businessId, co2, nonce });

    const tx = await usageRegistryContract.recordUsage(
      ethers.id(usageId),
      ethers.id(businessId),
      BigInt(co2),
      {
        nonce,
        maxFeePerGas: ethers.parseUnits('80', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei'),
      },
    );

    console.log('📤 TX SENT:', tx.hash);

    const receipt = await tx.wait(1); // chỉ cần 1 confirmation
    console.log('✅ TX MINED:', receipt.hash);

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  });
}
