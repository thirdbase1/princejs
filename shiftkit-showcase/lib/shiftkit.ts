// shiftkit-showcase/lib/shiftkit.ts

import type { Coin, Pair, Quote, Shift, Checkout } from './types';

// Custom Error classes for specific API failure scenarios
export class ShiftKitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShiftKitError';
  }
}

export class APIError extends ShiftKitError {
  constructor(message: string, public status: number, public response: any) {
    super(`API Error: ${message} (Status: ${status})`);
    this.name = 'APIError';
  }
}

export class NetworkError extends ShiftKitError {
  constructor(message: string) {
    super(`Network Error: ${message}`);
    this.name = 'NetworkError';
  }
}

// Configuration options for the ShiftKit client
interface ShiftKitOptions {
  secret: string;
  affiliateId: string;
  baseURL?: string;
}

/**
 * The main client for interacting with the SideShift.ai API.
 */
export class ShiftKit {
  private secret: string;
  private affiliateId: string;
  private baseURL: string;
  private headers: Record<string, string>;

  /**
   * Creates a new ShiftKit client instance.
   * @param options - Configuration options for the client.
   */
  constructor(options: ShiftKitOptions) {
    if (!options.secret) {
      throw new ShiftKitError('SideShift secret is required.');
    }
    if (!options.affiliateId) {
        throw new ShiftKitError('SideShift affiliateId is required.');
    }

    this.secret = options.secret;
    this.affiliateId = options.affiliateId;
    this.baseURL = options.baseURL || 'https://sideshift.ai/api/v2';

    this.headers = {
      'Content-Type': 'application/json',
      'x-sideshift-secret': this.secret,
    };
  }

  /**
   * A private method to handle all API requests.
   * It centrally manages authentication, error handling, and response parsing.
   * @param method - The HTTP method ('GET', 'POST', etc.).
   * @param endpoint - The API endpoint to call (e.g., '/coins').
   * @param body - The request body for POST requests.
   * @returns The JSON response from the API.
   */
  private async request<T>(method: 'GET' | 'POST', endpoint: string, body?: Record<string, any>): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: this.headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json();
        throw new APIError('Request failed', response.status, errorData);
      }

      return await response.json() as T;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      // This catches network errors, DNS issues, etc.
      throw new NetworkError(error instanceof Error ? error.message : 'An unknown network error occurred');
    }
  }

  // We will add the public methods for interacting with the API here in the next steps.

  /**
   * Fetches the list of all supported coins.
   * @returns A list of coin objects.
   */
  async getCoins(): Promise<Coin[]> {
    return this.request<Coin[]>('GET', '/coins');
  }

  /**
   * Fetches the list of all supported trading pairs.
   * @returns A list of pair objects.
   */
  async getPairs(): Promise<Pair[]> {
    return this.request<Pair[]>('GET', '/pairs');
  }

  /**
   * Requests a quote for a specific trade.
   * @param params - The parameters for the quote request.
   * @returns A quote object.
   */
  async requestQuote(params: {
    depositCoin: string;
    depositNetwork: string;
    settleCoin: string;
    settleNetwork: string;
    depositAmount?: string;
    settleAmount?: string;
  }): Promise<Quote> {
    return this.request<Quote>('POST', '/quotes', { ...params, affiliateId: this.affiliateId });
  }

  /**
   * Creates a new fixed-rate shift.
   * @param params - The parameters for the shift creation.
   * @returns A new shift object.
   */
  async createFixedShift(params: {
    quoteId: string;
    settleAddress: string;
    refundAddress?: string;
  }): Promise<Shift> {
    return this.request<Shift>('POST', '/shifts/fixed', { ...params, affiliateId: this.affiliateId });
  }

  /**
   * Fetches the details of a specific shift.
   * @param id - The ID of the shift to retrieve.
   * @returns A shift object.
   */
  async getShift(id: string): Promise<Shift> {
    return this.request<Shift>('GET', `/shifts/${id}`);
  }

  /**
   * Creates a new variable-rate shift.
   * @param params - The parameters for the variable rate shift.
   * @returns A new shift object.
   */
  async createVariableShift(params: {
    depositCoin: string;
    settleCoin: string;
    settleAddress: string;
    depositNetwork?: string;
    settleNetwork?: string;
    refundAddress?: string;
  }): Promise<Shift> {
    return this.request<Shift>('POST', '/shifts/variable', { ...params, affiliateId: this.affiliateId });
  }

  /**
   * Creates a new checkout for merchant payments.
   * @param params - The parameters for the checkout.
   * @returns A new checkout object.
   */
  async createCheckout(params: {
    depositCoin: string;
    settleCoin: string;
    depositNetwork?: string;
    settleNetwork?: string;
    settleAmount: string;
  }): Promise<Checkout> {
    return this.request<Checkout>('POST', '/checkouts', { ...params, affiliateId: this.affiliateId });
  }

  // --- High-Level Abstractions ---

  /**
   * Performs a complete fixed-rate swap with a single method call.
   * This handles requesting a quote and creating the shift automatically.
   * @param params - The parameters for the swap.
   * @returns The final created shift object.
   */
  async performFixedSwap(params: {
    depositCoin: string;
    depositNetwork: string;
    settleCoin: string;
    settleNetwork: string;
    depositAmount?: string;
    settleAmount?: string;
    settleAddress: string;
    refundAddress?: string;
  }): Promise<Shift> {
    const { settleAddress, refundAddress, ...quoteParams } = params;

    // 1. Get a quote
    const quote = await this.requestQuote(quoteParams);

    // 2. Create the shift with the quote
    const shift = await this.createFixedShift({
      quoteId: quote.id,
      settleAddress,
      refundAddress,
    });

    return shift;
  }

  /**
   * Waits for a shift to reach a terminal state, providing status updates along the way.
   * @param shiftId - The ID of the shift to wait for.
   * @param options - Configuration for polling and status updates.
   * @returns The final shift object.
   */
  async waitForShift(
    shiftId: string,
    options?: {
      onStatusChange?: (status: Shift['status']) => void;
      interval?: number; // in milliseconds
    }
  ): Promise<Shift> {
    const { onStatusChange, interval = 5000 } = options || {};
    let lastStatus: Shift['status'] | null = null;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const shift = await this.getShift(shiftId);

          if (shift.status !== lastStatus) {
            lastStatus = shift.status;
            onStatusChange?.(shift.status);
          }

          // Terminal states that should stop the polling
          if (['settled', 'expired', 'refunded', 'failed'].includes(shift.status)) {
            resolve(shift);
            return;
          }

          setTimeout(poll, interval);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}
