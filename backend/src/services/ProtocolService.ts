import { ethers } from 'ethers';
import { relayer } from './RelayerService.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const ACCESS_CONTROL_ABI = [
  'function hasAccess(address protocol, address user) view returns (bool)',
  'function protocolRequirements(address) view returns (uint32 minAge, bool isSet)',
  'function setRequirements(uint32 minAge)',
  'function requestAccessVerification(address user)',
  'event AccessGranted(address indexed user, address indexed protocol, bool result)',
  'event RequirementsSet(address indexed protocol, uint32 minAge)',
] as const;

export interface Requirements {
  minAge: number;
  isSet: boolean;
}

/**
 * ProtocolService — manages DeFi protocol KYC requirements and access checks
 * against the FHEProtocolAccessControl contract.
 */
export class ProtocolService {
  private contract(withSigner = false) {
    return new ethers.Contract(
      config.contracts.fheAccessControl,
      ACCESS_CONTROL_ABI,
      withSigner ? relayer.signer : relayer.getProvider()
    );
  }

  /**
   * Set minimum age requirements for a protocol (relayer signs and pays gas).
   * The relayer wallet must have PROTOCOL_MANAGER role or equivalent on the contract.
   */
  async setRequirements(
    minAge: number
  ): Promise<{ transactionHash: string }> {
    logger.info(`[Protocol] Setting requirements`, { minAge });

    const iface = new ethers.Interface(ACCESS_CONTROL_ABI);
    const data = iface.encodeFunctionData('setRequirements', [minAge]);

    const tx = await relayer.sendTransaction({
      to: config.contracts.fheAccessControl,
      data,
    });
    await tx.wait();

    logger.info(`[Protocol] Requirements set`, { minAge, hash: tx.hash });
    return { transactionHash: tx.hash };
  }

  /**
   * Read protocol requirements from chain (no gas required).
   */
  async getRequirements(protocolAddress: string): Promise<Requirements> {
    const contract = this.contract();
    const [minAge, isSet] = await (contract as any).protocolRequirements(
      protocolAddress
    );
    return { minAge: Number(minAge), isSet };
  }

  /**
   * Check whether a user passes a protocol's access requirements (read-only).
   */
  async checkAccess(
    protocolAddress: string,
    userAddress: string
  ): Promise<{ hasAccess: boolean }> {
    const contract = this.contract();
    const hasAccess = await (contract as any).hasAccess(
      protocolAddress,
      userAddress
    );
    return { hasAccess };
  }

  /**
   * Request on-chain access verification for a user (relayer signs).
   */
  async requestAccessVerification(
    userAddress: string
  ): Promise<{ transactionHash: string }> {
    logger.info(`[Protocol] Requesting access verification`, { userAddress });

    const iface = new ethers.Interface(ACCESS_CONTROL_ABI);
    const data = iface.encodeFunctionData('requestAccessVerification', [userAddress]);

    const tx = await relayer.sendTransaction({
      to: config.contracts.fheAccessControl,
      data,
    });
    await tx.wait();

    logger.info(`[Protocol] Verification requested`, { userAddress, hash: tx.hash });
    return { transactionHash: tx.hash };
  }
}

export const protocolService = new ProtocolService();
