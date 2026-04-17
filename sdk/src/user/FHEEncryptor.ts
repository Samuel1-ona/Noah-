import { createCofhesdkConfig, createCofhesdkClient } from '@cofhe/sdk/web';
import { createPublicClient, createWalletClient, custom, keccak256, toHex, type PublicClient, type WalletClient } from 'viem';
import { Encryptable, CofhesdkClient } from '@cofhe/sdk';
import { PermitUtils, type Permit } from '@cofhe/sdk/permits';
import { Eip1193Provider } from 'ethers';

/**
 * FHEEncryptor - Handles client-side encryption and permits for CoFHE (Sepolia)
 */
export class FHEEncryptor {
    private client: CofhesdkClient | null = null;
    private initialized: boolean = false;
    private eip1193: Eip1193Provider | null = null;

    constructor() { }

    /**
     * Initialize the Fhenix client for Ethereum Sepolia CoFHE
     * @param provider - Eip1193 provider (window.ethereum)
     */
    async initialize(provider: any): Promise<void> {
        if (this.initialized) return;

        // Get the EIP-1193 provider
        if (typeof window !== 'undefined' && 'ethereum' in window) {
            this.eip1193 = window.ethereum as Eip1193Provider;
        } else if (provider && provider.provider) {
            this.eip1193 = provider.provider as Eip1193Provider;
        } else if (provider && provider.request) {
            this.eip1193 = provider as Eip1193Provider;
        }

        if (!this.eip1193) {
            throw new Error('You must provide a EIP1193 object (eg: window.ethereum)');
        }

        const sepolia = {
            name: 'Ethereum Sepolia',
            id: 11155111,
            network: 'sepolia',
            coFheUrl: 'https://testnet-cofhe.fhenix.zone',
            verifierUrl: 'https://testnet-cofhe-vrf.fhenix.zone',
            thresholdNetworkUrl: 'https://testnet-cofhe-tn.fhenix.zone',
            environment: 'TESTNET' as const
        };

        const config = createCofhesdkConfig({
            supportedChains: [sepolia],
        });

        this.client = createCofhesdkClient(config);

        const publicClient = createPublicClient({ transport: custom(this.eip1193) });
        const walletClient = createWalletClient({ transport: custom(this.eip1193) });

        const result = await (this.client as any).connect(publicClient, walletClient);
        if (!result.success) {
            throw new Error(`Failed to connect to CoFHE: ${result.error.message}`);
        }

        this.initialized = true;
    }

    /**
     * Generate an EIP-712 permit for viewing sealed outputs
     * @param contractAddress - The contract requesting access
     */
    async getPermission(contractAddress: string): Promise<Permit> {
        if (!this.eip1193) throw new Error('FHEEncryptor not initialized');
        
        const publicClient = createPublicClient({ transport: custom(this.eip1193) }) as PublicClient;
        const walletClient = createWalletClient({ 
            transport: custom(this.eip1193),
            account: (await (window as any).ethereum.request({ method: 'eth_accounts' }))[0]
        }) as WalletClient;

        return await PermitUtils.createSelfAndSign(
            {
                issuer: walletClient.account!.address,
                validatorContract: contractAddress as `0x${string}`,
            },
            publicClient,
            walletClient
        );
    }

    /**
     * Decrypt a sealed result from a contract
     */
    async unseal(permit: Permit, sealedData: string): Promise<boolean> {
        try {
            // FHE.sealoutput returns a JSON string on CoFHE
            const ciphertext = JSON.parse(sealedData);
            const result = PermitUtils.unseal(permit, ciphertext);
            return result === 1n;
        } catch (e) {
            console.error('Failed to unseal result:', e);
            return false;
        }
    }

    /**
     * Generate a deterministic nullifier for Sybil resistance
     * @param docData - Document ID or hash
     */
    generateNullifier(docData: string): string {
        return keccak256(toHex(`NOAH_NULLIFIER_${docData}`));
    }

    /**
     * Encrypt age for FHE submission
     */
    async encryptAge(age: number): Promise<any> {
        if (!this.client) throw new Error('FHEEncryptor not initialized');

        console.log(`[FHEEncryptor] Encrypting age: ${age}`);
        const encryptedResult = await this.client
            .encryptInputs([Encryptable.uint32(BigInt(age))])
            .encrypt();
        
        console.log(`[FHEEncryptor] Raw encryption result:`, encryptedResult);

        if (!encryptedResult.success) {
            throw new Error(`Encryption failed: ${encryptedResult.error.message}`);
        }

        const [encryptedAge] = encryptedResult.data;
        return encryptedAge;
    }
}
