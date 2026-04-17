import { ContractClient } from './ContractClient.js';
import { APIClient, type APIClientConfig } from './APIClient.js';
import { OCRExtractor } from '../utils/ocr.js';
import { extractMRZData, type MRZData, type MRZOptions } from '../utils/mrz.js';
import type {
    ContractClientConfig,
    Proof,
    TransactionResult,
    Requirements
} from '../utils/types.js';
import type { Signer } from 'ethers';

export class NoahError extends Error {
    constructor(public message: string, public code: string) {
        super(message);
        this.name = 'NoahError';
    }
}

export class NoahValidationError extends NoahError {
    constructor(message: string) {
        super(message, 'VALIDATION_ERROR');
    }
}

export class NoahProverError extends NoahError {
    constructor(message: string) {
        super(message, 'PROVER_ERROR');
    }
}

/**
 * NoahSDK - Main entry point for the Noah Protocol
 */
export class NoahSDK {
    public contracts: ContractClient;
    public api: APIClient;
    private ocrExtractor: OCRExtractor;

    constructor(config?: ContractClientConfig & APIClientConfig) {
        this.contracts = new ContractClient(config);
        this.api = new APIClient(config);
        this.ocrExtractor = new OCRExtractor();
    }

    /**
     * Extract identity data from a document image (Passport or ID Card)
     * @param image - File, URL, or Blob of the document image
     * @param options - Optional MRZ parsing options (defaults to permissive in demo)
     */
    public async extractIdentityData(image: File | string | Blob, options: MRZOptions = { strict: false, force: true }): Promise<MRZData> {
        const { mrzLines } = await this.ocrExtractor.extractMRZ(image);

        if (mrzLines.length === 0) {
            throw new NoahValidationError('Could not detect MRZ lines in the image. Please ensure the document is clear and properly aligned.');
        }

        try {
            return extractMRZData(mrzLines, options);
        } catch (error) {
            throw new NoahValidationError(`Failed to parse identity data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Legacy alias for extractIdentityData
     */
    public async extractPassportData(image: File | string | Blob): Promise<MRZData> {
        return this.extractIdentityData(image);
    }

    /**
     * Initialize the SDK with a provider
     */
    public init(provider: any): void {
        this.contracts.initialize(provider);
    }

    /**
     * High-level method to register identity with FHE encryption
     */
    public async registerWithFHE(
        signer: Signer,
        userAddress: string,
        age: number,
        nullifier?: string
    ): Promise<TransactionResult> {
        try {
            // 1. Initialize Prover via Contract handles (addresses would be fetched/configured)
            // For now, using default ContractClient

            // 2. Encryption (using UserClient under the hood or direct handles)
            // This is just a convenience wrapper
            const { UserClient } = await import('../user/UserClient.js');
            const userClient = new UserClient(signer);

            const encryptionResult = await userClient.encryptIdentity({ age });

            if (!encryptionResult.success) {
                throw new NoahProverError('Encryption failed');
            }

            const finalNullifier = nullifier || (await import('ethers')).ethers.id(userAddress + "_identity_v1");

            // 3. Submit to Chain
            return await this.contracts.registerIdentity(
                signer,
                userAddress,
                finalNullifier,
                { data: encryptionResult.data }
            );
        } catch (error) {
            if (error instanceof NoahError) throw error;
            throw new NoahError(error instanceof Error ? error.message : 'Unknown error', 'INTERNAL_ERROR');
        }
    }


    /**
     * Get protocol requirements via contract client
     */
    public async getProtocolRequirements(protocolAddress: string): Promise<Requirements> {
        return this.contracts.getRequirements(protocolAddress);
    }
}
