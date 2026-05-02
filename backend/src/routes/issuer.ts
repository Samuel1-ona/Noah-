import { Router } from 'express';
import { issuerService } from '../services/IssuerService.js';
import { requireApiKey } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { success } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import {
  RegisterCredentialSchema,
  RevokeCredentialSchema,
  AddIssuerSchema,
} from '../schemas/issuer.schema.js';

const router = Router();

/**
 * POST /issuer/credential/register
 * Link a credential hash to an on-chain registered identity.
 * The user must already have a registered identity (POST /identity/register).
 *
 * Body: { credentialHash, userAddress }
 */
router.post(
  '/credential/register',
  requireApiKey,
  validate(RegisterCredentialSchema),
  async (req, res, next) => {
    try {
      const { credentialHash, userAddress } = req.body;
      logger.info(`[Issuer Route] /credential/register`, { credentialHash, userAddress });

      const result = await issuerService.registerCredential(credentialHash, userAddress);
      success(res, result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /issuer/credential/revoke
 * Revoke a previously issued credential hash.
 *
 * Body: { credentialHash }
 */
router.post(
  '/credential/revoke',
  requireApiKey,
  validate(RevokeCredentialSchema),
  async (req, res, next) => {
    try {
      const { credentialHash } = req.body;
      logger.info(`[Issuer Route] /credential/revoke`, { credentialHash });

      const result = await issuerService.revokeCredential(credentialHash);
      success(res, result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /issuer/credential/:hash
 * Check the validity and revocation status of a credential hash.
 */
router.get(
  '/credential/:hash',
  requireApiKey,
  async (req, res, next) => {
    try {
      const { hash } = req.params;
      logger.info(`[Issuer Route] /credential/:hash`, { hash });

      const result = await issuerService.checkCredential(hash);
      success(res, result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /issuer/add
 * Add a new trusted issuer address to the FHENoahRegistry (admin only).
 * Relayer must have OWNER role on the contract.
 *
 * Body: { issuerAddress, name }
 */
router.post(
  '/add',
  requireApiKey,
  validate(AddIssuerSchema),
  async (req, res, next) => {
    try {
      const { issuerAddress, name } = req.body;
      logger.info(`[Issuer Route] /add`, { issuerAddress, name });

      const result = await issuerService.addIssuer(issuerAddress, name);
      success(res, result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
