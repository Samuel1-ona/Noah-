import { OCRExtractor } from './ocr.js';
import { extractMRZData, type MRZData } from './mrz.js';

export interface IdentityProfile extends MRZData {
    confidence: number;
}

/**
 * IdentityManager - Orchestrates OCR and MRZ parsing for Noah SDK
 */
export class IdentityManager {
    private ocr: OCRExtractor;

    constructor() {
        this.ocr = new OCRExtractor();
    }

    /**
     * Extract identity profile from a document image
     * @param imageSource - URL, File, or Blob of the document
     * @returns IdentityProfile containing parsed data and OCR confidence
     */
    async extractFromImage(imageSource: string | File | Blob): Promise<IdentityProfile> {
        const ocrResult = await this.ocr.extractMRZ(imageSource);

        if (ocrResult.mrzLines.length === 0) {
            throw new Error(`Failed to detect MRZ lines in image. Please ensure the document is clear and properly aligned.`);
        }

        try {
            // Use the universal parser to handle TD1 (ID cards) and TD3 (Passports)
            const mrzData = extractMRZData(ocrResult.mrzLines);

            return {
                ...mrzData,
                confidence: ocrResult.confidence,
            };
        } catch (error: any) {
            throw new Error(`Failed to parse identity data: ${error.message}`);
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        await this.ocr.terminate();
    }
}
