import { Networks } from '@stellar/stellar-sdk';

export type NetworkName = 'testnet' | 'public';

export interface NetworkConfig {
  name: NetworkName;
  passphrase: string;
  horizonUrl: string;
  /** Testnet only. */
  friendbotUrl?: string;
  explorerUrl: string;
}

export const NETWORKS: Record<NetworkName, NetworkConfig> = {
  testnet: {
    name: 'testnet',
    passphrase: Networks.TESTNET,
    horizonUrl: 'https://horizon-testnet.stellar.org',
    friendbotUrl: 'https://friendbot.stellar.org',
    explorerUrl: 'https://stellar.expert/explorer/testnet',
  },
  public: {
    name: 'public',
    passphrase: Networks.PUBLIC,
    horizonUrl: 'https://horizon.stellar.org',
    explorerUrl: 'https://stellar.expert/explorer/public',
  },
};

/**
 * The whole anchor handoff. Endpoints, signing key and asset issuer are
 * discovered from the home domain's stellar.toml, so switching to a production
 * anchor means changing `network` and `homeDomain` only (PRD FR-21).
 */
export interface AnchorConfig {
  homeDomain: string;
  assetCode: string;
  network: NetworkConfig;
}

export const DEFAULT_HOME_DOMAIN = 'tr-mock-anchor.fly.dev';

export function loadConfig(env: Record<string, string | undefined>): AnchorConfig {
  const name = env.STELLAR_NETWORK || 'testnet';
  if (name !== 'testnet' && name !== 'public') {
    throw new Error(`unknown STELLAR_NETWORK "${name}" (expected testnet or public)`);
  }
  return {
    homeDomain: env.ANCHOR_HOME_DOMAIN || DEFAULT_HOME_DOMAIN,
    assetCode: env.ANCHOR_ASSET_CODE || 'USDC',
    network: NETWORKS[name],
  };
}
