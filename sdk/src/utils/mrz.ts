export interface MRZData {
    documentType: string;
    issuingState: string;
    lastName: string;
    firstName: string;
    documentNumber: string;
    nationality: string;
    dateOfBirth: Date;
    gender: string;
    expiryDate: Date;
    personalNumber?: string;
    age: number;
    format: 'TD1' | 'TD3';
    mrzLines?: string[];
    checksums: {
        documentNumber: boolean;
        dateOfBirth: boolean;
        expiryDate: boolean;
        composite: boolean;
        wasRepaired?: boolean;
    };
}

export interface MRZOptions {
    strict?: boolean;
    fuzzy?: boolean;
    force?: boolean;
}

/**
 * Internal helper to normalize common OCR misreads in MRZ strings
 */
function normalizeMRZString(str: string, toNumeric: boolean = true): string {
    const toNum: Record<string, string> = { 
        'O': '0', 'Q': '0', 'D': '0', 'U': '0',
        'I': '1', 'L': '1', 'J': '1', 'T': '1', '7': '1',
        'Z': '2', 'B': '8', 'S': '5', 'G': '6', 'A': '4',
        '(': '0', '[': '0', ')': '0', ']': '0'
    };
    const toAlpha: Record<string, string> = { 
        '0': 'O', '1': 'I', '2': 'Z', '8': 'B', '5': 'S', '6': 'G', '4': 'A',
        '<': '<' // Preserve filler
    };
    
    // Special case for fillers: L or I at the end of a name part are often <
    let processed = str;
    if (!toNumeric) {
        processed = processed.replace(/L+$/g, match => '<'.repeat(match.length));
        processed = processed.replace(/I+$/g, match => '<'.repeat(match.length));
    }

    return processed.split('').map(char => {
        if (toNumeric && toNum[char]) return toNum[char];
        if (!toNumeric && toAlpha[char]) return toAlpha[char];
        return char;
    }).join('');
}

/**
 * Advanced validation that attempts to repair alphanumeric ambiguity (e.g. 8 vs B)
 */
export function validateCheckDigitWithRepair(str: string, checkDigit: string): { valid: boolean; value: string; wasRepaired: boolean } {
    const weights = [7, 3, 1];
    const calculate = (input: string) => {
        let sum = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            let value = 0;
            if (char === '<') {
                value = 0;
            } else if (/[0-9]/.test(char)) {
                value = parseInt(char);
            } else if (/[A-Z]/.test(char)) {
                value = char.charCodeAt(0) - 65 + 10;
            }
            sum += value * weights[i % 3];
        }
        return (sum % 10).toString();
    };

    const fixedCD = normalizeMRZString(checkDigit, true);
    
    // Strategy 1: As is
    if (calculate(str) === fixedCD) return { valid: true, value: str, wasRepaired: false };

    // Strategy 2: Numeric normalization (replaces B with 8, O with 0 etc)
    const numericStr = normalizeMRZString(str, true);
    if (calculate(numericStr) === fixedCD) {
        console.log(`[MRZ] Repaired numeric field: ${str} -> ${numericStr}`);
        return { valid: true, value: numericStr, wasRepaired: true };
    }

    // Strategy 3: Alpha-Numeric Deep Repair (specifically for B/8, 0/O ambiguity in Passport Numbers)
    const ambiguities: Record<string, string[]> = {
        '8': ['B'], 'B': ['8'],
        '0': ['O', 'D', 'Q'], 'O': ['0', 'D', 'Q'],
        '1': ['I', 'L', 'T'], 'I': ['1', 'L', 'T'],
        '5': ['S'], 'S': ['5'],
        '2': ['Z'], 'Z': ['2']
    };

    const chars = str.split('');
    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        if (ambiguities[char]) {
            for (const replacement of ambiguities[char]) {
                const testChars = [...chars];
                testChars[i] = replacement;
                const testStr = testChars.join('');
                if (calculate(testStr) === fixedCD) {
                    console.log(`[MRZ] Deep repair matched: Position ${i}, swapped ${char} for ${replacement}. Final: ${testStr}`);
                    return { valid: true, value: testStr, wasRepaired: true };
                }
            }
        }
    }

    console.warn(`[MRZ] Check digit failed for ${str}. Expected ${calculate(str)}, found ${fixedCD}`);
    return { valid: false, value: str, wasRepaired: false };
}

/**
 * Legacy validation (for backward compatibility)
 */
export function validateCheckDigit(str: string, checkDigit: string, fuzzy: boolean = true): boolean {
    return validateCheckDigitWithRepair(str, checkDigit).valid;
}

function parseDate(str: string, isDOB: boolean = false): Date {
    const cleanStr = normalizeMRZString(str, true);
    const yearStr = cleanStr.substring(0, 2);
    const month = Math.max(0, Math.min(11, parseInt(cleanStr.substring(2, 4)) - 1));
    const day = Math.max(1, Math.min(31, parseInt(cleanStr.substring(4, 6))));

    let year = parseInt(yearStr);
    const currentYear = new Date().getFullYear() % 100;

    if (isDOB) {
        if (year > currentYear) {
            year += 1900;
        } else {
            year += 2000;
        }
    } else {
        year += 2000;
    }

    return new Date(year, month, day);
}

function calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const m = today.getMonth() - dateOfBirth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
        age--;
    }
    return age;
}

/**
 * Parse TD3 (Passport) format: 2 lines of 44 characters
 */
export function parseTD3(line1: string, line2: string, options: MRZOptions = { strict: true }): MRZData {
    if (line1.length !== 44 || line2.length !== 44) {
        throw new Error(`Invalid MRZ length. L1: ${line1.length}, L2: ${line2.length}`);
    }

    const documentType = line1.substring(0, 2).replace(/</g, '');
    const issuingState = line1.substring(2, 5).replace(/</g, '');

    const namesPart = line1.substring(5);
    const [lastNamePart, firstNamePart] = namesPart.split('<<');
    // Normalize names to clean up misread fillers like 'L'
    const normalizedLastName = normalizeMRZString(lastNamePart, false);
    const normalizedFirstName = normalizeMRZString(firstNamePart || '', false);
    
    const lastName = normalizedLastName.replace(/</g, ' ').trim();
    const firstName = normalizedFirstName.replace(/</g, ' ').trim();

    const documentNumberStr = line2.substring(0, 9);
    const docCheck = line2.substring(9, 10);
    const docRes = validateCheckDigitWithRepair(documentNumberStr, docCheck);
    if (!options.force && options.strict && !docRes.valid) {
        throw new Error('Invalid document number check digit');
    }

    const nationality = line2.substring(10, 13).replace(/</g, '');
    const dobStr = line2.substring(13, 19);
    const dobCheck = line2.substring(19, 20);
    const dobRes = validateCheckDigitWithRepair(dobStr, dobCheck);
    if (!options.force && options.strict && !dobRes.valid) {
        throw new Error('Invalid date of birth check digit');
    }
    const dateOfBirth = parseDate(dobRes.value, true);

    const gender = line2.substring(20, 21);
    const expiryStr = line2.substring(21, 27);
    const expiryCheck = line2.substring(27, 28);
    const expRes = validateCheckDigitWithRepair(expiryStr, expiryCheck);
    if (!options.force && options.strict && !expRes.valid) {
        throw new Error('Invalid expiry date check digit');
    }
    const expiryDate = parseDate(expRes.value, false);

    const personalNumber = line2.substring(28, 42).replace(/</g, '');
    
    // Composite check
    const compositeBase = line2.substring(0, 10) + line2.substring(13, 20) + line2.substring(21, 43);
    const compositeCheck = line2.substring(43, 44);
    const compositeRes = validateCheckDigitWithRepair(compositeBase, compositeCheck);

    return {
        documentType,
        issuingState,
        lastName,
        firstName,
        documentNumber: docRes.value.replace(/</g, ''),
        nationality,
        dateOfBirth,
        gender,
        expiryDate,
        personalNumber,
        age: calculateAge(dateOfBirth),
        format: 'TD3',
        mrzLines: [line1, line2],
        checksums: {
            documentNumber: docRes.valid,
            dateOfBirth: dobRes.valid,
            expiryDate: expRes.valid,
            composite: compositeRes.valid,
            wasRepaired: docRes.wasRepaired || dobRes.wasRepaired || expRes.wasRepaired || compositeRes.wasRepaired
        }
    };
}

/**
 * Parse TD1 (ID Card) format: 3 lines of 30 characters
 */
export function parseTD1(line1: string, line2: string, line3: string, options: MRZOptions = { strict: true }): MRZData {
    if (line1.length !== 30 || line2.length !== 30 || line3.length !== 30) {
        throw new Error(`Invalid MRZ length. L1: ${line1.length}, L2: ${line2.length}, L3: ${line3.length}`);
    }

    const documentType = line1.substring(0, 2).replace(/</g, '');
    const issuingState = line1.substring(2, 5).replace(/</g, '');
    
    const documentNumberStr = line1.substring(5, 14);
    const docCheck = line1.substring(14, 15);
    const docRes = validateCheckDigitWithRepair(documentNumberStr, docCheck);
    if (!options.force && options.strict && !docRes.valid) {
        throw new Error('Invalid document number check digit');
    }

    const dobStr = line2.substring(0, 6);
    const dobCheck = line2.substring(6, 7);
    const dobRes = validateCheckDigitWithRepair(dobStr, dobCheck);
    if (!options.force && options.strict && !dobRes.valid) {
        throw new Error('Invalid date of birth check digit');
    }
    const dateOfBirth = parseDate(dobRes.value, true);

    const gender = line2.substring(7, 8);
    const expiryStr = line2.substring(8, 14);
    const expiryCheck = line2.substring(14, 15);
    const expRes = validateCheckDigitWithRepair(expiryStr, expiryCheck);
    if (!options.force && options.strict && !expRes.valid) {
        throw new Error('Invalid expiry date check digit');
    }
    const expiryDate = parseDate(expRes.value, false);

    const nationality = line2.substring(15, 18).replace(/</g, '');
    const personalNumber = line2.substring(18, 29).replace(/</g, '');

    const compositeBase = line1.substring(5, 30) + line2.substring(0, 7) + line2.substring(8, 15) + line2.substring(18, 29);
    const compositeCheck = line2.substring(29, 30);
    const compositeRes = validateCheckDigitWithRepair(compositeBase, compositeCheck);

    const normalizedNames = normalizeMRZString(line3, false);
    const [lastNamePart, firstNamePart] = normalizedNames.split('<<');
    const lastName = lastNamePart.replace(/</g, ' ').trim();
    const firstName = (firstNamePart || '').replace(/</g, ' ').trim();

    return {
        documentType,
        issuingState,
        lastName,
        firstName,
        documentNumber: docRes.value.replace(/</g, ''),
        nationality,
        dateOfBirth,
        gender,
        expiryDate,
        personalNumber,
        age: calculateAge(dateOfBirth),
        format: 'TD1',
        mrzLines: [line1, line2, line3],
        checksums: {
            documentNumber: docRes.valid,
            dateOfBirth: dobRes.valid,
            expiryDate: expRes.valid,
            composite: compositeRes.valid
        }
    };
}

/**
 * Universal MRZ Parser
 */
export function extractMRZData(lines: string[], options: MRZOptions = { strict: true }): MRZData {
    const cleaned = lines.map(l => l.trim().toUpperCase().replace(/\s/g, ''));
    
    const debugInfo = `Raw OCR Lines: ${cleaned.join('|')}`;
    
    try {
        if (cleaned.length >= 3) {
            const td1Lines = cleaned.filter(l => l.length >= 28 && l.length <= 32);
            if (td1Lines.length >= 3) {
                const normalized = td1Lines.slice(0, 3).map(l => {
                    if (l.length < 30) return l.padEnd(30, '<');
                    if (l.length > 30) return l.substring(0, 30);
                    return l;
                });
                return parseTD1(normalized[0], normalized[1], normalized[2], options);
            }
        } 
        
        if (cleaned.length >= 2) {
            const td3Lines = cleaned.filter(l => l.length >= 42 && l.length <= 46);
            if (td3Lines.length >= 2) {
                const normalized = td3Lines.slice(0, 2).map(l => {
                    if (l.length < 44) return l.padEnd(44, '<');
                    if (l.length > 44) return l.substring(0, 44);
                    return l;
                });
                return parseTD3(normalized[0], normalized[1], options);
            }
        }
    } catch (error) {
        throw new Error(`${error instanceof Error ? error.message : 'Unknown parsing error'} [DEBUG: ${debugInfo}]`);
    }

    throw new Error(`Insufficient MRZ lines detected. Found ${cleaned.length} lines. [DEBUG: ${debugInfo}]`);
}
