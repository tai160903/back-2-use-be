import { provider, wallet } from './usageRegistry.contract';

let queue: Promise<void> = Promise.resolve();

export function enqueueTx<T>(fn: (nonce: number) => Promise<T>): Promise<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;

  const p = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  queue = queue
    .then(async () => {
      const nonce = await provider.getTransactionCount(
        wallet.address,
        'pending',
      );
      const result = await fn(nonce);
      resolve(result);
    })
    .catch((err) => {
      reject(err);
    });

  return p;
}
