import { ethers, type Signer } from 'ethers';
import type { Requirements, TransactionResult, ContractAddresses } from '../utils/types';
import { ContractClient } from '../core/ContractClient';
import { FHEEncryptor } from './FHEEncryptor';
import { IdentityManager } from '../utils/identity';

/**
 * Credential data structure for FHE encryption
 */
export interface Credential {
  age: number;
  userAddress?: string;
  nullifier?: string; 
}

/**
 * FHE Input result for Fhenix
 */
export interface FHEInputResult {
  data: string;
  success: boolean;
}

/**
 * UserClient configuration options
 */
export interface UserClientConfig {
  contractAddresses?: Partial<ContractAddresses>;
  rpcUrl?: string;
  issuerPrivateKey?: string;
}

/**
 * UserClient - High-level API for end-user applications on CoFHE (Sepolia)
 */
export class UserClient {
  private signer: Signer;
  private contractClient: ContractClient;
  private fheEncryptor: FHEEncryptor;
  private identityManager: IdentityManager;
  private issuerPrivateKey?: string;

  constructor(signer: Signer, config: UserClientConfig = {}) {
    if (!signer) {
      throw new Error('Signer is required');
    }

    this.signer = signer;
    this.issuerPrivateKey = config.issuerPrivateKey;

    this.contractClient = new ContractClient({
      provider: signer.provider || undefined,
      contractAddresses: config.contractAddresses as ContractAddresses | undefined,
      rpcUrl: config.rpcUrl,
    });

    this.fheEncryptor = new FHEEncryptor();
    this.identityManager = new IdentityManager();
  }

  /**
   * Encrypt user identity attributes using FHE on CoFHE
   */
    async encryptIdentity(credential: Credential): Promise<FHEInputResult> {
        try {
            await this.fheEncryptor.initialize(this.signer.provider);
            const result = await this.fheEncryptor.encryptAge(credential.age);
            
            console.log(`[UserClient] FHE identity encrypted successfully.`);

            return {
                data: result, // This is now the full {ctHash, utype, securityZone, signature} object
                success: true,
            };
        }
        catch (error: any) {
            console.error("[UserClient] encryptIdentity error:", error);
            throw new Error(`Failed to encrypt identity: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Register identity on-chain with encrypted age and deterministic nullifier
     */
    async registerIdentity(
        userAddress: string,
        fheInput: FHEInputResult,
        nullifier?: string
    ): Promise<TransactionResult> {
        try {
            console.log(`[UserClient] registerIdentity for ${userAddress}`);
            
            // Use SDK's deterministic nullifier if none provided
            const finalNullifier = nullifier || this.fheEncryptor.generateNullifier(userAddress);
            console.log(`[UserClient] Using nullifier: ${finalNullifier}`);

            // If an issuer key is configured, use it to sign the transaction
            // This satisfies the 'onlyIssuer' requirement on the contract
            let signingSigner = this.signer;
            if (this.issuerPrivateKey) {
                console.log(`[UserClient] Signing with Issuer Manager private key...`);
                // Ensure we pass the provider to the new Wallet instance
                const provider = this.signer.provider;
                if (!provider) {
                    console.warn("[UserClient] Signer has no provider. Issuer Wallet will be created without provider.");
                }
                signingSigner = new ethers.Wallet(this.issuerPrivateKey, provider || undefined);
            }
            else {
                console.log(`[UserClient] Signing with user's primary signer...`);
            }

            // Pass the entire data object (struct) to the contract client
            return await this.contractClient.registerIdentity(
                signingSigner,
                userAddress,
                finalNullifier,
                fheInput.data 
            );
        }
        catch (error: any) {
            console.error(`[UserClient] Registration error:`, error);
            throw new Error(`Failed to register identity: ${error.message || 'Unknown error'}`);
        }
    }

  /**
   * High-level verification flow for protocols (Permits + Unsealing)
   */
  async verifyRequirement(
    protocolAddress: string,
    userAddress?: string
  ): Promise<boolean> {
    const finalUserAddress = userAddress || (await this.signer.getAddress());

    try {
      await this.fheEncryptor.initialize(this.signer.provider);
      
      // 1. Generate Permit for the protocol contract
      const permit = await this.fheEncryptor.getPermission(protocolAddress);
      
      // 2. Query the contract for a sealed result
      const sealedResult = await this.contractClient.verifyAccess(finalUserAddress, permit);
      
      // 3. Unseal the result off-chain
      return await this.fheEncryptor.unseal(permit, sealedResult);
    } catch (error: any) {
      throw new Error(`Failed to verify requirement: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Check if a user is registered
   */
  async isRegistered(userAddress?: string): Promise<boolean> {
    const finalUserAddress = userAddress || (await this.signer.getAddress());
    return await this.contractClient.isRegistered(finalUserAddress);
  }

  /**
   * Get protocol requirements
   */
  async getProtocolRequirements(protocolAddress: string): Promise<Requirements> {
    return await this.contractClient.getRequirements(protocolAddress);
  }
}
