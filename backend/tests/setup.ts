/**
 * Jest global setup — inject env vars before any module is imported.
 * Uses a Hardhat test account (publicly known) so no real funds are at risk.
 */
process.env.RELAYER_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
process.env.API_KEY   = 'test-api-key-for-jest-32chars-ok!';
process.env.RPC_URL   = 'https://ethereum-sepolia.publicnode.com';
process.env.NODE_ENV  = 'test';
process.env.LOG_LEVEL = 'error'; // silence logs during tests
