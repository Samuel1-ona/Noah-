import {
  ethers,
  BrowserProvider,
  JsonRpcProvider,
  type Provider,
  type Signer,
  type Contract,
  type ContractTransactionResponse,
  type Eip1193Provider
} from 'ethers';
import type {
  ContractAddresses,
  Requirements,
  TransactionResult,
  ContractClientConfig,
} from '../utils/types.js';

/**
 * Contract ABIs - Updated for CoFHE (Sepolia) and Sybil Resistance
 */
const CREDENTIAL_REGISTRY_ABI = [
  'function isRegistered(address) view returns (bool)',
  'function trustedIssuers(address) view returns (bool)',
  'function registerIdentity(address user, bytes32 nullifier, (uint256 ctHash, uint256 utype, uint256 securityZone, bytes signature) ageInput)',
  'function identityNullifiers(bytes32) view returns (address)',
  'function addressToNullifiers(address) view returns (bytes32)',
  'function getEncryptedAge(address user) view returns ((uint256 ctHash, uint256 utype, uint256 securityZone, bytes signature))',
  'function getSealedAge(address user, bytes32 publicKey) view returns (string)',
  'function addIssuer(address issuer, string memory name)',
  'event IdentityRegistered(address indexed user, address indexed issuer)',
  'event IssuerAdded(address indexed issuer, string name)',
] as const;

const PROTOCOL_ACCESS_CONTROL_ABI = [
  'function verifyAccessSealed(address user, (bytes32 publicKey, bytes signature) permission) view returns (string)',
  'function protocolRequirements(address) view returns (uint32 minAge, bool isSet)',
  'function setRequirements(uint32 minAge)',
  'event RequirementsSet(address indexed protocol, uint32 minAge)',
  'event AccessVerified(address indexed protocol, address indexed user)',
] as const;

/**
 * Contract Client Service
 * Handles direct smart contract interactions for read and write operations on Sepolia
 */
export class ContractClient {

  private provider: Provider | null = null;
  private credentialRegistry: Contract | null = null;
  private protocolAccessControl: Contract | null = null;
  private contractAddresses: ContractAddresses;
  private rpcUrl: string;

  constructor(config?: ContractClientConfig) {
    this.contractAddresses = {
      CredentialRegistry: config?.contractAddresses?.CredentialRegistry || "0xd6ACEA76AAF465559Ff9F287b4F883f18368325B",
      ZKVerifier: config?.contractAddresses?.ZKVerifier || '0x0000000000000000000000000000000000000000',
      ProtocolAccessControl: config?.contractAddresses?.ProtocolAccessControl || "0x503De26148ACa67Aa97E12eC545B22e7216f1BE4",
    };

    this.rpcUrl = config?.rpcUrl || 'https://ethereum-sepolia.publicnode.com';

    if (config?.provider) {
      this.initialize(config.provider);
    }
  }

  initialize(inputProvider?: any): void {
    if (!inputProvider) {
      this.provider = new JsonRpcProvider(this.rpcUrl);
    } else if (inputProvider.request) {
      this.provider = new BrowserProvider(inputProvider as Eip1193Provider);
    } else {
      this.provider = inputProvider as Provider;
    }

    this.credentialRegistry = new ethers.Contract(
      this.contractAddresses.CredentialRegistry,
      CREDENTIAL_REGISTRY_ABI,
      this.provider
    );
    this.protocolAccessControl = new ethers.Contract(
      this.contractAddresses.ProtocolAccessControl,
      PROTOCOL_ACCESS_CONTROL_ABI,
      this.provider
    );
  }

  async isRegistered(userAddress: string): Promise<boolean> {
    if (!this.credentialRegistry) this.initialize();
    return await this.credentialRegistry!.isRegistered(userAddress);
  }

  /**
   * CoFHE: Verify access using a permit and sealed output
   */
  async verifyAccess(userAddress: string, permission: any): Promise<string> {
    if (!this.protocolAccessControl) this.initialize();
    try {
      // Correcting method call to match new ABI
      return await this.protocolAccessControl!.verifyAccessSealed(userAddress, permission);
    } catch (error) {
      throw new Error(`Failed to verify access: ${error}`);
    }
  }

  async getRequirements(protocolAddress: string): Promise<Requirements> {
    if (!this.protocolAccessControl) this.initialize();
    const [minAge, isSet] = await this.protocolAccessControl!.protocolRequirements(protocolAddress);
    return {
      minAge: Number(minAge),
      allowedJurisdictions: [],
      requireAccredited: false,
      isSet,
    };
  }

  async registerIdentity(
    signer: Signer,
    userAddress: string,
    nullifier: string,
    ageInput: any
  ): Promise<TransactionResult> {
    console.log(`[ContractClient] registerIdentity called for ${userAddress}`);
    
    if (!signer.provider) {
      console.warn("[ContractClient] Signer has no provider. Attempting to use default provider.");
    }

    const contract = new ethers.Contract(this.contractAddresses.CredentialRegistry, CREDENTIAL_REGISTRY_ABI, signer);
    
    if (typeof contract.registerIdentity !== 'function') {
      throw new Error(`[ContractClient] registerIdentity is not a function on the contract. ABI mismatch? Address: ${this.contractAddresses.CredentialRegistry}`);
    }

    try {
      console.log(`[ContractClient] Sending registerIdentity transaction...`);
      console.log(`[ContractClient] Args: user=${userAddress}, nullifier=${nullifier}, hasAgeInput=${!!ageInput}`);
      const tx = await contract.registerIdentity(userAddress, nullifier, ageInput);
      
      if (!tx) {
        throw new Error("[ContractClient] Transaction response was undefined. This might happen if the signer/provider is not correctly configured.");
      }

      console.log(`[ContractClient] Transaction sent: ${tx.hash}. Waiting for receipt...`);
      const receipt = await tx.wait();
      
      console.log(`[ContractClient] Transaction confirmed in block ${receipt.blockNumber}`);
      return { transactionHash: tx.hash, receipt };
    } catch (error: any) {
      console.error("[ContractClient] Error in registerIdentity:", error);
      throw error;
    }
  }

  async setRequirements(
    signer: Signer,
    minAge: number
  ): Promise<TransactionResult> {
    const contract = new ethers.Contract(this.contractAddresses.ProtocolAccessControl, PROTOCOL_ACCESS_CONTROL_ABI, signer);
    const tx = await contract.setRequirements(minAge) as ContractTransactionResponse;
    const receipt = await tx.wait();
    return { transactionHash: tx.hash, receipt };
  }

  getContractAddresses(): ContractAddresses { return this.contractAddresses; }
  getProvider(): Provider | null { return this.provider; }
}
