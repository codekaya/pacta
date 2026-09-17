import { request } from './http.js';
import type { AnchorClient } from './sep.js';

/**
 * Sandbox only: play the Turkish bank. On a real anchor the customer's
 * FAST/EFT transfer, with the reference in the açıklama, credits the deposit —
 * there is no such endpoint, so nothing outside the demo should call this.
 */
export function simulateBankTransfer(anchor: AnchorClient, txId: string, amount: string): Promise<unknown> {
  if (anchor.config.network.name !== 'testnet') {
    throw new Error('simulateBankTransfer is a testnet sandbox helper');
  }
  return request(`${anchor.info.transferServer}/tx/${encodeURIComponent(txId)}/simulate-bank-transfer`, {
    method: 'POST',
    body: { amount },
  });
}
