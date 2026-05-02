import 'dotenv/config';

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Relayer
  relayerPrivateKey: requireEnv('RELAYER_PRIVATE_KEY'),
  rpcUrl: process.env.RPC_URL || 'https://ethereum-sepolia.publicnode.com',
  chainId: parseInt(process.env.CHAIN_ID || '11155111', 10),

  // Contracts
  contracts: {
    fheNoahRegistry: process.env.FHE_NOAH_REGISTRY_ADDRESS || '0xd6ACEA76AAF465559Ff9F287b4F883f18368325B',
    fheAccessControl: process.env.FHE_ACCESS_CONTROL_ADDRESS || '0x503De26148ACa67Aa97E12eC545B22e7216f1BE4',
  },

  // Auth
  apiKey: requireEnv('API_KEY'),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),

  // Relayer health threshold (ETH)
  relayerMinBalanceEth: parseFloat(process.env.RELAYER_MIN_BALANCE_ETH || '0.05'),
} as const;
