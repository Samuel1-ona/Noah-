import { Router } from 'express';
import { ethers } from 'ethers';
import { protocolService } from '../services/ProtocolService.js';
import { requireApiKey } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { success, error } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import {
  SetRequirementsSchema,
  CheckAccessSchema,
  RequestVerificationSchema,
} from '../schemas/protocol.schema.js';

const router = Router();

/**
 * POST /protocol/requirements
 * Set minimum age requirements for a protocol (relayer signs and pays gas).
 * The relayer wallet must hold the appropriate role on the contract.
 *
 * Body: { minAge }
 */
router.post(
  '/requirements',
  requireApiKey,
  validate(SetRequirementsSchema),
  async (req, res, next) => {
    try {
      const { minAge } = req.body;
      logger.info(`[Protocol Route] /requirements`, { minAge });

      const result = await protocolService.setRequirements(minAge);
      success(res, result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /protocol/requirements/:address
 * Get the on-chain KYC requirements for a given protocol address.
 * Public — no auth required.
 */
router.get('/requirements/:address', async (req, res, next) => {
  try {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      error(res, 'Invalid Ethereum address', 400, 'VALIDATION_ERROR', 'address');
      return;
    }

    const result = await protocolService.getRequirements(address);
    success(res, { protocolAddress: address, ...result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /protocol/access/check
 * Check whether a user passes a protocol's KYC requirements (read-only).
 * Public — no auth required.
 *
 * Body: { protocolAddress, userAddress }
 */
router.post(
  '/access/check',
  validate(CheckAccessSchema),
  async (req, res, next) => {
    try {
      const { protocolAddress, userAddress } = req.body;

      const result = await protocolService.checkAccess(protocolAddress, userAddress);
      success(res, { protocolAddress, userAddress, ...result });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /protocol/access/request
 * Trigger an on-chain requestAccessVerification call for a user via the relayer.
 *
 * Body: { protocolAddress, userAddress }
 */
router.post(
  '/access/request',
  requireApiKey,
  validate(RequestVerificationSchema),
  async (req, res, next) => {
    try {
      const { userAddress } = req.body;
      logger.info(`[Protocol Route] /access/request`, { userAddress });

      const result = await protocolService.requestAccessVerification(userAddress);
      success(res, result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
