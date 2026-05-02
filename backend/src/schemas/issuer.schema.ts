import { z } from 'zod';
import { ethers } from 'ethers';

const address = z
  .string()
  .refine((v) => ethers.isAddress(v), { message: 'Must be a valid Ethereum address' });

const bytes32 = z
  .string()
  .regex(/^0x[0-9a-fA-F]{64}$/, 'Must be a 32-byte hex string (0x + 64 hex chars)');

export const RegisterCredentialSchema = z.object({
  credentialHash: bytes32,
  userAddress: address,
});

export const RevokeCredentialSchema = z.object({
  credentialHash: bytes32,
});

export const AddIssuerSchema = z.object({
  issuerAddress: address,
  name: z.string().min(1).max(100),
});

export type RegisterCredentialInput = z.infer<typeof RegisterCredentialSchema>;
export type RevokeCredentialInput = z.infer<typeof RevokeCredentialSchema>;
export type AddIssuerInput = z.infer<typeof AddIssuerSchema>;
