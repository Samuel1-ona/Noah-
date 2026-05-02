import { ethers } from 'ethers';
import { relayer } from './RelayerService.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const REGISTRY_ABI = [
  'function isRegistered(address) view returns (bool)',
  'function trustedIssuers(address) view returns (bool)',
  'function addIssuer(address issuer, string memory name)',
] as const;

export interface CredentialStatus {
  isValid: boolean;
  isRevoked: boolean;
  credentialHash: string;
  issuer?: string;
}

/**
 * IssuerService — credential management via the FHENoahRegistry.
 *
 * In the current FHE migration, credentials map to on-chain identity
 * registrations. Richer per-credential attestations are tracked here
 * as in-memory records pending a future on-chain registry upgrade.
 */
export class IssuerService {
  // In-memory revocation set — replace with DB in production
  private revokedHashes = new Set<string>();

  private registryContract(withSigner = false) {
    return new ethers.Contract(
      config.contracts.fheNoahRegistry,
      REGISTRY_ABI,
      withSigner ? relayer.signer : relayer.getProvider()
    );
  }

  /**
   * Register a credential on-chain (maps to isRegistered check on the address).
   * If useRelayer = true, the relayer wallet submits the addIssuer call if needed.
   */
  async registerCredential(
    credentialHash: string,
    userAddress: string
  ): Promise<{ transactionHash: string; message: string }> {
    logger.info(`[Issuer] Register credential`, { credentialHash, userAddress });

    // Verify the user is already registered (identity must exist first)
    const contract = this.registryContract();
    const registered = await (contract as any).isRegistered(userAddress);
    if (!registered) {
      throw new Error(
        `User ${userAddress} has no registered identity. Run /identity/register first.`
      );
    }

    // For the current FHE model, credential registration is an off-chain record
    // that references the on-chain identity. Return a synthetic "hash" of the record.
    const recordHash = ethers.keccak256(
      ethers.toUtf8Bytes(
        JSON.stringify({ credentialHash, userAddress, ts: Date.now() })
      )
    );

    logger.info(`[Issuer] Credential record created`, { recordHash });

    return {
      transactionHash: recordHash, // synthetic until on-chain registry expanded
      message: 'Credential linked to on-chain identity. No separate gas cost required.',
    };
  }

  /**
   * Revoke a credential (in-memory; replace with on-chain call in v2).
   */
  async revokeCredential(
    credentialHash: string
  ): Promise<{ message: string }> {
    logger.info(`[Issuer] Revoking credential`, { credentialHash });
    this.revokedHashes.add(credentialHash.toLowerCase());
    return { message: `Credential ${credentialHash} revoked successfully.` };
  }

  /**
   * Check credential validity.
   */
  async checkCredential(credentialHash: string): Promise<CredentialStatus> {
    const isRevoked = this.revokedHashes.has(credentialHash.toLowerCase());
    return {
      isValid: !isRevoked,
      isRevoked,
      credentialHash,
    };
  }

  /**
   * Add a trusted issuer address to the registry (admin-only, relayer signs).
   */
  async addIssuer(
    issuerAddress: string,
    name: string
  ): Promise<{ transactionHash: string }> {
    logger.info(`[Issuer] Adding trusted issuer`, { issuerAddress, name });

    const iface = new ethers.Interface(REGISTRY_ABI);
    const data = iface.encodeFunctionData('addIssuer', [issuerAddress, name]);

    const tx = await relayer.sendTransaction({
      to: config.contracts.fheNoahRegistry,
      data,
    });
    await tx.wait();

    logger.info(`[Issuer] Issuer added`, { issuerAddress, hash: tx.hash });
    return { transactionHash: tx.hash };
  }
}

export const issuerService = new IssuerService();
