import { createWorker, type Worker } from 'tesseract.js';

export interface OCROutput {
    rawText: string;
    mrzLines: string[];
    confidence: number;
}

/**
 * OCR Extractor optimized for Identity Documents (Passports, ID Cards)
 */
export class OCRExtractor {
    private worker: Worker | null = null;
    private initialized: boolean = false;

    /**
     * Initialize Tesseract worker with MRZ-friendly parameters
     */
    async initialize() {
        if (this.initialized) return;

        // MRZ is always Latin characters (OCR-B font standard)
        this.worker = await createWorker('eng'); 
        
        await this.worker.setParameters({
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
            tessedit_pageseg_mode: '6' as any, // Assume a single uniform block of text
            preserve_interword_spaces: '0',    // MRZ shouldn't have inter-word spaces
        });

        this.initialized = true;
    }

    /**
     * Extract MRZ data from an image
     * @param imageSource - URL, File, or Blob
     */
    async extractMRZ(imageSource: string | File | Blob): Promise<OCROutput> {
        await this.initialize();

        if (!this.worker) {
            throw new Error('OCR Worker not initialized');
        }

        const { data } = await this.worker.recognize(imageSource);
        const { text, confidence, lines } = data;

        // More robust line extraction using positional data
        const detectedLines = this.extractValidMRZLines(lines);

        return {
            rawText: text,
            mrzLines: detectedLines,
            confidence,
        };
    }

    /**
     * Identify and sort valid MRZ lines (TD1 or TD3) from OCR blocks
     */
    private extractValidMRZLines(ocrLines: any[]): string[] {
        // Regex for TD3 (44 chars) or TD1 (30 chars)
        const td3Regex = /^[A-Z0-9<]{44}$/;
        const td1Regex = /^[A-Z0-9<]{30}$/;

        const validLines = ocrLines
            .map(line => ({
                text: line.text.trim().toUpperCase().replace(/\s/g, ''),
                y: line.bbox.y0 // Vertical position
            }))
            .filter(item => item.text.length >= 28 && item.text.length <= 46);

        // Sort by vertical position (top to bottom)
        return validLines
            .sort((a, b) => a.y - b.y)
            .map(item => item.text);
    }

    /**
     * Terminate the worker to free resources
     */
    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
            this.initialized = false;
        }
    }
}
