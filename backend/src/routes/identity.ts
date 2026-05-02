import { Router } from 'express';
import multer from 'multer';
import { ethers } from 'ethers';
import { identityService } from '../services/IdentityService.js';
import { requireApiKey } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { success, error } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import {
  RegisterIdentitySchema,
  CheckAccessSchema,
  RequestVerificationSchema,
} from '../schemas/identity.schema.js';

const router = Router();

// Multer — accept image uploads up to 10 MB in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are accepted'));
    }
  },
});

/**
 * POST /identity/extract
 * Extract identity attributes from a passport/ID image via OCR + MRZ parsing.
 * Accepts multipart/form-data with field name "image".
 */
router.post(
  '/extract',
  requireApiKey,
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        error(res, 'No image file provided. Send image as multipart field "image".', 400, 'VALIDATION_ERROR', 'image');
        return;
      }

      logger.info(`[Identity Route] /extract`, {
        mimetype: req.file.mimetype,
        sizeBytes: req.file.size,
      });

      const result = await identityService.extractIdentityFromImage(req.file.buffer);

      if (result.mrzLines.length === 0) {
        error(res, 'Could not detect MRZ lines in the image. Ensure the document is clear and properly aligned.', 422, 'OCR_ERROR');
        return;
      }

      success(res, result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /identity/register
 * Register a user's FHE-encrypted identity on-chain via the relayer.
 * The FHE encryption must be performed client-side using @cofhe/sdk.
 *
 * Body: { userAddress, fheInput: { ctHash, utype, securityZone, signature }, nullifier? }
 */
router.post(
  '/register',
  requireApiKey,
  validate(RegisterIdentitySchema),
  async (req, res, next) => {
    try {
      const { userAddress, fheInput, nullifier } = req.body;

      logger.info(`[Identity Route] /register`, { userAddress });

      const result = await identityService.registerIdentity(
        userAddress,
        fheInput,
        nullifier
      );

      success(res, result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /identity/status/:address
 * Check whether a wallet address has a registered identity on-chain.
 * Public — no auth required.
 */
router.get('/status/:address', async (req, res, next) => {
  try {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      error(res, 'Invalid Ethereum address', 400, 'VALIDATION_ERROR', 'address');
      return;
    }

    const isRegistered = await identityService.isRegistered(address);
    success(res, { address, isRegistered });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /identity/verify
 * Check if a user has access to a given protocol (read-only, no FHE permit needed).
 *
 * Body: { protocolAddress, userAddress }
 */
router.post(
  '/verify',
  requireApiKey,
  validate(CheckAccessSchema),
  async (req, res, next) => {
    try {
      const { protocolAddress, userAddress } = req.body;

      logger.info(`[Identity Route] /verify`, { protocolAddress, userAddress });

      const hasAccess = await identityService.checkAccess(protocolAddress, userAddress);
      success(res, { protocolAddress, userAddress, hasAccess });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /identity/nullifier/:address
 * Compute and return the deterministic nullifier for a given user address.
 * Does not write on-chain.
 */
router.get('/nullifier/:address', requireApiKey, (req, res) => {
  const { address } = req.params;

  if (!ethers.isAddress(address)) {
    error(res, 'Invalid Ethereum address', 400, 'VALIDATION_ERROR', 'address');
    return;
  }

  const nullifier = identityService.computeNullifier(address);
  success(res, { address, nullifier });
});

/**
 * POST /identity/access/request
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
      const { protocolAddress, userAddress } = req.body;

      logger.info(`[Identity Route] /access/request`, { protocolAddress, userAddress });

      const result = await identityService.requestAccessVerification(
        protocolAddress,
        userAddress
      );
      success(res, result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
