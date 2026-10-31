/**
 * APAAR Validation Service & Sandbox Integration Adapter
 * Implements official Verhoeff checksum algorithm used in 12-digit Indian national identity registries.
 */

import { ApaarValidationStatus } from '../types.ts';

// Verhoeff algorithm multiplication table
const d: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

// Verhoeff algorithm permutation table
const p: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

// Verhoeff inverse table
const inv: number[] = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Validates a string of digits using Verhoeff algorithm
 */
export function validateVerhoeff(numStr: string): boolean {
  if (!numStr || !/^\d+$/.test(numStr)) return false;
  let c = 0;
  const digits = numStr.split('').map(Number).reverse();

  for (let i = 0; i < digits.length; i++) {
    c = d[c][p[i % 8][digits[i]]];
  }
  return c === 0;
}

/**
 * Generates Verhoeff check digit for an 11-digit input to form a valid 12-digit number
 */
export function generateVerhoeffCheckDigit(numStr: string): number {
  let c = 0;
  const digits = numStr.split('').map(Number).reverse();

  for (let i = 0; i < digits.length; i++) {
    c = d[c][p[(i + 1) % 8][digits[i]]];
  }
  return inv[c];
}

export function maskApaarId(apaarId?: string): string {
  if (!apaarId) return '•••• •••• ••••';
  const clean = String(apaarId).replace(/[\s\-]+/g, '');
  if (clean.length < 4) return '•••• •••• ••••';
  return `•••• •••• ${clean.slice(-4)}`;
}

export function formatApaarDisplay(apaarId?: string): string {
  if (!apaarId) return '';
  const clean = String(apaarId).replace(/[\s\-]+/g, '');
  if (clean.length !== 12) return clean;
  return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)}`;
}

/**
 * Generates a valid 12-digit APAAR ID guaranteed to satisfy the Verhoeff algorithm.
 * Useful for Sandbox registration, automated testing, and demoing.
 */
export function generateSampleApaar(seed?: string): string {
  let base: string;
  if (seed && /^\d{11}$/.test(seed)) {
    base = seed;
  } else {
    // Generate 11 random digits with non-zero initial digit
    const firstDigit = Math.floor(1 + Math.random() * 9);
    const rest = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
    base = `${firstDigit}${rest}`;
  }
  const checkDigit = generateVerhoeffCheckDigit(base);
  return `${base}${checkDigit}`;
}

export interface ValidationResult {
  isValid: boolean;
  status: ApaarValidationStatus;
  code: string;
  errors: string[];
  isChecksumValid: boolean;
  cleanApaar?: string;
  maskedApaar?: string;
  formattedApaar?: string;
  adapterInfo: {
    adapter: 'SANDBOX_ADAPTER' | 'OFFICIAL_GATEWAY_INTERFACE';
    timestamp: string;
    verifiedLocally: boolean;
  };
}

export function validateApaarStructure(apaarId: unknown): ValidationResult {
  const timestamp = new Date().toISOString();
  const errors: string[] = [];

  const raw = String(apaarId ?? '').trim();

  if (!raw) {
    return {
      isValid: false,
      status: 'INVALID',
      code: 'ERR_APAAR_MISSING',
      errors: ['APAAR ID is missing or empty.'],
      isChecksumValid: false,
      adapterInfo: { adapter: 'SANDBOX_ADAPTER', timestamp, verifiedLocally: true },
    };
  }

  const clean = raw.replace(/[\s\-]+/g, '');

  if (!/^\d+$/.test(clean)) {
    return {
      isValid: false,
      status: 'INVALID',
      code: 'ERR_APAAR_NON_NUMERIC',
      errors: ['APAAR ID must contain numeric digits only.'],
      isChecksumValid: false,
      cleanApaar: clean,
      maskedApaar: maskApaarId(clean),
      adapterInfo: { adapter: 'SANDBOX_ADAPTER', timestamp, verifiedLocally: true },
    };
  }

  if (clean.length !== 12) {
    return {
      isValid: false,
      status: 'INVALID',
      code: 'ERR_APAAR_LENGTH',
      errors: [`APAAR ID must be exactly 12 digits (received ${clean.length} digits).`],
      isChecksumValid: false,
      cleanApaar: clean,
      maskedApaar: maskApaarId(clean),
      adapterInfo: { adapter: 'SANDBOX_ADAPTER', timestamp, verifiedLocally: true },
    };
  }

  // Check repeating digits like 000000000000 or 111111111111
  if (/^(\d)\1{11}$/.test(clean)) {
    return {
      isValid: false,
      status: 'INVALID',
      code: 'ERR_APAAR_REPETITIVE',
      errors: ['APAAR ID cannot consist of 12 repeating identical digits.'],
      isChecksumValid: false,
      cleanApaar: clean,
      maskedApaar: maskApaarId(clean),
      adapterInfo: { adapter: 'SANDBOX_ADAPTER', timestamp, verifiedLocally: true },
    };
  }

  // Check Verhoeff checksum
  const isChecksumOk = validateVerhoeff(clean);
  if (!isChecksumOk) {
    errors.push('APAAR Verhoeff checksum digit is invalid or does not match official algorithm.');
  }

  return {
    isValid: isChecksumOk,
    status: isChecksumOk ? 'VALID' : 'INVALID',
    code: isChecksumOk ? 'SUCCESS_VALIDATED' : 'ERR_CHECKSUM_MISMATCH',
    errors,
    isChecksumValid: isChecksumOk,
    cleanApaar: clean,
    maskedApaar: maskApaarId(clean),
    formattedApaar: formatApaarDisplay(clean),
    adapterInfo: {
      adapter: 'SANDBOX_ADAPTER',
      timestamp,
      verifiedLocally: true,
    },
  };
}
