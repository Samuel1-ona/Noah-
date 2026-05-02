import { Router } from 'express';
import { relayer } from '../services/RelayerService.js';
import { requireApiKey } from '../middleware/auth.js';
import { success } from '../utils/response.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /health
 * Public — returns server status, uptime, and relayer wallet address.
 */
router.get('/health', (_req, res) => {
  success(res, {
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    relayerAddress: relayer.address,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /relayer/status
 * Auth required — returns relayer wallet balance and pending tx count.
 */
router.get('/relayer/status', requireApiKey, async (_req, res, next) => {
  try {
    const balanceEth = await relayer.getBalanceEth();
    const provider = relayer.getProvider();
    const pendingCount = await provider.getTransactionCount(relayer.address, 'pending');
    const confirmedCount = await provider.getTransactionCount(relayer.address, 'latest');

    logger.debug(`[Health] Relayer status checked`, { balanceEth });

    success(res, {
      address: relayer.address,
      balanceEth,
      nonce: {
        confirmed: confirmedCount,
        pending: pendingCount,
        inFlight: pendingCount - confirmedCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
