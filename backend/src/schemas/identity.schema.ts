import { z } from 'zod';
import { ethers } from 'ethers';

const address = z
  .string()
  .refine((v) => ethers.isAddress(v), { message: 'Must be a valid Ethereum address' });

const bytes32 = z
  .string()
  .regex(/^0x[0-9a-fA-F]{64}$/, 'Must be a 32-byte hex string (0x + 64 hex chars)');

export const RegisterIdentitySchema = z.object({
  userAddress: address,
  /** FHE-encrypted age struct generated client-side via @cofhe/sdk */
  fheInput: z.object({
    ctHash: z.union([z.string(), z.number(), z.bigint()]),
    utype: z.union([z.string(), z.number(), z.bigint()]),
    securityZone: z.union([z.string(), z.number(), z.bigint()]),
    signature: z.string().startsWith('0x', 'Signature must be a hex string starting with 0x'),
  }),
  /** Optional — server computes deterministically if omitted */
  nullifier: bytes32.optional(),
});

export const CheckAccessSchema = z.object({
  protocolAddress: address,
  userAddress: address,
});

export const RequestVerificationSchema = z.object({
  protocolAddress: address,
  userAddress: address,
});

export type RegisterIdentityInput = z.infer<typeof RegisterIdentitySchema>;
export type CheckAccessInput = z.infer<typeof CheckAccessSchema>;
export type RequestVerificationInput = z.infer<typeof RequestVerificationSchema>;
