// shiftkit-showcase/lib/types.ts

/**
 * Represents a cryptocurrency supported by SideShift.ai.
 */
export interface Coin {
  coin: string;
  name: string;
  networks: string[];
  hasMemo: boolean;
  logo: string;
  min: string;
  max: string;
}

/**
 * Represents a pair of assets that can be swapped.
 */
export interface Pair {
  depositCoin: string;
  settleCoin: string;
  depositNetwork: string;
  settleNetwork: string;
  min: string;
  max: string;
}

/**
 * Represents a price quote for a potential shift.
 */
export interface Quote {
  id: string;
  depositCoin: string;
  depositNetwork: string;
  settleCoin: string;
  settleNetwork: string;
  depositAmount: string;
  settleAmount: string;
  rate: string;
  expiresAt: string; // ISO 8601 Date
}

/**
 * Represents the status of a shift.
 */
export type ShiftStatus =
  | 'pending'
  | 'processing'
  | 'settling'
  | 'settled'
  | 'expired'
  | 'refund'
  | 'refunding'
  | 'refunded'
  | 'failed';

/**
 * Represents a single shift (swap) transaction.
 */
export interface Shift {
  id: string;
  type: 'fixed' | 'variable';
  status: ShiftStatus;
  depositAddress: {
    address: string;
    memo?: string;
  };
  depositCoin: string;
  depositNetwork: string;
  settleAddress: {
    address: string;
    memo?: string;
  };
  settleCoin: string;
  settleNetwork: string;
  depositAmount?: string;
  settleAmount?: string;
  rate?: string;
  createdAt: string; // ISO 8601 Date
  expiresAt?: string; // ISO 8601 Date
}

/**
 * Represents a checkout session for merchant payments.
 */
export interface Checkout {
  id: string;
  url: string;
  depositCoin: string;
  depositNetwork: string;
  settleCoin: string;
  settleNetwork: string;
  depositAmount: string;
  settleAmount: string;
  expiresAt: string; // ISO 8601 Date
}
