import 'dotenv/config';
import { ethers } from 'ethers';
import { wallet, provider } from '../blockchain/usageRegistry.contract';

async function clearStuckNonce() {
  const nonceInfo = {
    latest: await provider.getTransactionCount(wallet.address, 'latest'),
    pending: await provider.getTransactionCount(wallet.address, 'pending'),
  };

  console.log('📊 Nonce before:', nonceInfo);

  if (nonceInfo.pending <= nonceInfo.latest) {
    console.log('✅ Không có nonce bị kẹt, không cần clear');
    return;
  }

  const stuckNonce = 17;

  console.log('🚑 Clearing nonce:', stuckNonce);

  const tx = await wallet.sendTransaction({
    to: wallet.address,
    value: 0n,
    nonce: stuckNonce,
    gasLimit: 21000n,
    maxFeePerGas: ethers.parseUnits('900', 'gwei'),
    maxPriorityFeePerGas: ethers.parseUnits('500', 'gwei'),
  });

  console.log('📤 Clear TX sent:', tx.hash);

  const receipt = await tx.wait();

  if (!receipt) {
    throw new Error('TX dropped or not mined');
  }

  console.log('✅ Clear TX mined:', {
    hash: receipt.hash,
    block: receipt.blockNumber,
  });

  const after = {
    latest: await provider.getTransactionCount(wallet.address, 'latest'),
    pending: await provider.getTransactionCount(wallet.address, 'pending'),
  };

  console.log('📊 Nonce after:', after);
}

clearStuckNonce().catch(console.error);
