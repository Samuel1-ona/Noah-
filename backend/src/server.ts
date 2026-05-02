import 'dotenv/config';
import app from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { relayer } from './services/RelayerService.js';

const { port } = config;

async function start() {
  // Startup health check — confirm relayer wallet is reachable and funded
  try {
    const balance = await relayer.getBalanceEth();
    logger.info(`[Server] Relayer wallet ready`, {
      address: relayer.address,
      balanceEth: balance,
    });
    await relayer.checkBalance();
  } catch (err: any) {
    logger.error(`[Server] Could not connect to RPC or load relayer wallet`, {
      error: err?.message,
      rpcUrl: config.rpcUrl,
    });
    // Don't crash on startup if RPC is unreachable — allows local dev without a wallet
  }

  const server = app.listen(port, () => {
    logger.info(`[Server] Noah Backend running`, {
      port,
      env: config.nodeEnv,
      baseUrl: `http://localhost:${port}/api/v1`,
    });
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info(`[Server] ${signal} received — shutting down gracefully`);
    server.close(() => {
      logger.info('[Server] HTTP server closed');
      process.exit(0);
    });
    // Force exit after 10 s if connections won't close
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

start();
