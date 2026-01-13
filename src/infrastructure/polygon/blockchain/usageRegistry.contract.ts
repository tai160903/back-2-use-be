import 'dotenv/config';
import { ethers } from 'ethers';
import UsageRegistryABI from '../artifacts/UsageRegistry.abi.json';

const RPC_URL = process.env.RPC_URL!;
const PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY!;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;

if (!RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
  throw new Error('Missing env variables');
}

// Provider
export const provider = new ethers.JsonRpcProvider(RPC_URL);

// Wallet (signer)
export const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// 🔎 DEBUG BOOTSTRAP
(async () => {
  console.log('🔗 RPC_URL:', RPC_URL);

  const network = await provider.getNetwork();
  console.log('🌐 Network:', network.name, network.chainId); 

  const balance = await provider.getBalance(wallet.address);
  console.log(
    '👛 Wallet:',
    wallet.address,
    'Balance:',
    ethers.formatEther(balance),
  );

  const code = await provider.getCode(CONTRACT_ADDRESS);
  console.log('📜 Contract code exists:', code !== '0x');

  const latest = await provider.getTransactionCount(wallet.address, 'latest');
  const pending = await provider.getTransactionCount(wallet.address, 'pending');

  console.log({ latest, pending });
})();

// Contract instance
export const usageRegistryContract = new ethers.Contract(
  CONTRACT_ADDRESS,
  UsageRegistryABI,
  wallet,
);
