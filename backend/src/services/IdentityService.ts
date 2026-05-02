import { ethers } from 'ethers';
import { createWorker } from 'tesseract.js';
import { relayer } from './RelayerService.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// ── ABIs (subset needed server-side) ─────────────────────────────────────────
const REGISTRY_ABI = [
  'function isRegistered(address) view returns (bool)',
  'function registerIdentity(address user, bytes32 nullifier, (uint256 ctHash, uint256 utype, uint256 securityZone, bytes signature) ageInput)',
  'function addressToNullifiers(address) view returns (bytes32)',
] as const;

const ACCESS_CONTROL_ABI = [
  'function hasAccess(address protocol, address user) view returns (bool)',
  'function requestAccessVerification(address user)',
] as const;

/**
 * FHE age input struct as expected by FHENoahRegistry.registerIdentity
 */
export interface FHEAgeInput {
  ctHash: bigint | string;
  utype: bigint | string;
  securityZone: bigint | string;
  signature: string; // bytes hex
}

export interface RegisterResult {
  transactionHash: string;
  nullifier: string;
  relayerAddress: string;
  gasUsed: string;
}

/**
 * IdentityService — server-side identity operations.
 *
 * NOTE: FHE encryption itself (FHEEncryptor) requires window.ethereum and runs
 * client-side only. This service accepts the already-encrypted FHE data struct
 * and submits it to the chain via the relayer wallet.
 */
export class IdentityService {
  private registryContract() {
    return new ethers.Contract(
      config.contracts.fheNoahRegistry,
      REGISTRY_ABI,
      relayer.getProvider()
    );
  }

  private accessContract() {
    return new ethers.Contract(
      config.contracts.fheAccessControl,
      ACCESS_CONTROL_ABI,
      relayer.getProvider()
    );
  }

  /** Compute a deterministic nullifier for a user address (no on-chain write). */
  computeNullifier(userAddress: string): string {
    return ethers.keccak256(
      ethers.toUtf8Bytes(`NOAH_NULLIFIER_${userAddress.toLowerCase()}`)
    );
  }

  /**
   * Check whether a wallet address has a registered identity on-chain.
   */
  async isRegistered(userAddress: string): Promise<boolean> {
    const contract = this.registryContract();
    return await (contract as any).isRegistered(userAddress);
  }

  /**
   * Submit a registerIdentity transaction via the relayer.
   * The FHE-encrypted age struct is generated client-side and passed in.
   */
  async registerIdentity(
    userAddress: string,
    fheInput: FHEAgeInput,
    nullifier?: string
  ): Promise<RegisterResult> {
    const finalNullifier = nullifier || this.computeNullifier(userAddress);

    logger.info(`[Identity] Registering identity`, {
      userAddress,
      nullifier: finalNullifier,
    });

    const iface = new ethers.Interface(REGISTRY_ABI);
    const data = iface.encodeFunctionData('registerIdentity', [
      userAddress,
      finalNullifier,
      {
        ctHash: BigInt(fheInput.ctHash),
        utype: BigInt(fheInput.utype),
        securityZone: BigInt(fheInput.securityZone),
        signature: fheInput.signature,
      },
    ]);

    const tx = await relayer.sendTransaction({
      to: config.contracts.fheNoahRegistry,
      data,
    });

    const receipt = await tx.wait();
    await relayer.checkBalance();

    logger.info(`[Identity] Registration confirmed`, {
      userAddress,
      hash: tx.hash,
      block: receipt?.blockNumber,
    });

    return {
      transactionHash: tx.hash,
      nullifier: finalNullifier,
      relayerAddress: relayer.address,
      gasUsed: receipt?.gasUsed?.toString() ?? '0',
    };
  }

  /**
   * Check whether a user satisfies a protocol's access requirements (read-only).
   * For the full FHE-sealed verification flow the client uses the SDK directly.
   */
  async checkAccess(protocolAddress: string, userAddress: string): Promise<boolean> {
    const contract = this.accessContract();
    return await (contract as any).hasAccess(protocolAddress, userAddress);
  }

  /**
   * Trigger an on-chain requestAccessVerification via the relayer.
   */
  async requestAccessVerification(
    protocolAddress: string,
    userAddress: string
  ): Promise<{ transactionHash: string }> {
    logger.info(`[Identity] Requesting access verification`, {
      protocol: protocolAddress,
      user: userAddress,
    });

    const iface = new ethers.Interface(ACCESS_CONTROL_ABI);
    const data = iface.encodeFunctionData('requestAccessVerification', [userAddress]);

    const tx = await relayer.sendTransaction({
      to: config.contracts.fheAccessControl,
      data,
    });

    await tx.wait();
    logger.info(`[Identity] Access verification requested`, { hash: tx.hash });
    return { transactionHash: tx.hash };
  }

  /**
   * Extract MRZ identity data from a passport/ID image using Tesseract OCR.
   * Works entirely server-side — no FHE or wallet required.
   */
  async extractIdentityFromImage(imageBuffer: Buffer): Promise<{
    rawText: string;
    mrzLines: string[];
    confidence: number;
    parsed: Record<string, string>;
  }> {
    logger.info(`[Identity] Running OCR on document image`);

    const worker = await createWorker('eng');
    try {
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
        tessedit_pageseg_mode: '6' as any,
        preserve_interword_spaces: '0',
      });

      const { data } = await worker.recognize(imageBuffer);
      const mrzLines = this.extractMRZLines(data.lines as any[]);

      const parsed = this.parseMRZ(mrzLines);

      return {
        rawText: data.text,
        mrzLines,
        confidence: data.confidence,
        parsed,
      };
    } finally {
      await worker.terminate();
    }
  }

  private extractMRZLines(ocrLines: any[]): string[] {
    return ocrLines
      .map((l) => ({
        text: l.text.trim().toUpperCase().replace(/\s/g, ''),
        y: l.bbox?.y0 ?? 0,
      }))
      .filter((l) => l.text.length >= 28 && l.text.length <= 46)
      .sort((a, b) => a.y - b.y)
      .map((l) => l.text);
  }

  /**
   * Minimal TD3 (passport) MRZ parser.
   * Returns named fields or an empty object for unrecognised formats.
   */
  private parseMRZ(lines: string[]): Record<string, string> {
    try {
      if (lines.length < 2 || lines[0].length !== 44) return {};
      const [line1, line2] = lines;

      const rawLastName = line1.substring(5, 44).split('<<')[0].replace(/</g, ' ').trim();
      const firstNamePart = line1.substring(5, 44).split('<<')[1] ?? '';
      const firstName = firstNamePart.replace(/</g, ' ').trim();

      const docNumber = line2.substring(0, 9).replace(/</g, '');
      const nationality = line2.substring(10, 13).replace(/</g, '');
      const dobRaw = line2.substring(13, 19);
      const sex = line2.substring(20, 21);
      const expiryRaw = line2.substring(21, 27);

      const parseDOB = (raw: string) => {
        const yr = parseInt(raw.substring(0, 2), 10);
        const mo = raw.substring(2, 4);
        const dy = raw.substring(4, 6);
        const fullYear = yr > 30 ? 1900 + yr : 2000 + yr;
        return `${fullYear}-${mo}-${dy}`;
      };

      const parseExpiry = (raw: string) => {
        const yr = parseInt(raw.substring(0, 2), 10);
        const mo = raw.substring(2, 4);
        const dy = raw.substring(4, 6);
        return `20${yr.toString().padStart(2, '0')}-${mo}-${dy}`;
      };

      const dob = parseDOB(dobRaw);
      const expiry = parseExpiry(expiryRaw);
      const birthYear = parseInt(dob.split('-')[0], 10);
      const age = new Date().getFullYear() - birthYear;

      return {
        lastName: rawLastName,
        firstName,
        documentNumber: docNumber,
        nationality,
        dateOfBirth: dob,
        age: age.toString(),
        sex,
        expiryDate: expiry,
        documentType: 'PASSPORT',
      };
    } catch {
      return {};
    }
  }
}

export const identityService = new IdentityService();
