import { z } from 'zod';

// Schema for creating a managed shift (our core feature)
export const CreateManagedShiftSchema = z.object({
  depositCoin: z.string(),
  depositNetwork: z.string().optional(),
  settleCoin: z.string(),
  settleNetwork: z.string().optional(),
  settleAmount: z.string(),
  userWebhookUrl: z.string().url(),
  refundAddress: z.string().optional(),
  refundMemo: z.string().optional(),
  userIp: z.string().optional(),
  externalId: z.string().optional()
});

// Schema for getting a quote
export const CreateQuoteSchema = z.object({
  depositCoin: z.string(),
  depositNetwork: z.string().optional(),
  settleCoin: z.string(),
  settleNetwork: z.string().optional(),
  settleAmount: z.string().optional(),
  depositAmount: z.string().optional(),
});

// Schema for creating a checkout
export const CreateCheckoutSchema = z.object({
  settleCoin: z.string(),
  settleNetwork: z.string().optional(),
  settleAddress: z.string(),
  settleMemo: z.string().optional(),
  settleAmount: z.string(),
  userIp: z.string().optional(),
});

// Schema for the incoming webhook from SideShift
export const SideShiftWebhookSchema = z.object({
    id: z.string(),
    type: z.string(),
    status: z.string(),
    createdAt: z.string().datetime(),
    depositAddress: z.string().optional(),
    depositAmount: z.string().optional(),
    settleAddress: z.string().optional(),
    settleAmount: z.string().optional(),
});
