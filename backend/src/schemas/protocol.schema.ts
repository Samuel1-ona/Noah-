import { z } from 'zod';
import { ethers } from 'ethers';

const address = z
  .string()
  .refine((v) => ethers.isAddress(v), { message: 'Must be a valid Ethereum address' });

export const SetRequirementsSchema = z.object({
  minAge: z
    .number({ required_error: 'minAge is required' })
    .int('minAge must be an integer')
    .min(0, 'minAge must be >= 0')
    .max(150, 'minAge must be <= 150'),
});

export const CheckAccessSchema = z.object({
  protocolAddress: address,
  userAddress: address,
});

export const RequestVerificationSchema = z.object({
  protocolAddress: address,
  userAddress: address,
});

export type SetRequirementsInput = z.infer<typeof SetRequirementsSchema>;
export type CheckAccessInput = z.infer<typeof CheckAccessSchema>;
export type RequestVerificationInput = z.infer<typeof RequestVerificationSchema>;
