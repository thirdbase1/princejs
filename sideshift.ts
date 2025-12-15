import { z } from 'zod';

const SIDESHIFT_API_URL = 'https://sideshift.ai/api/v2';

const SideShiftErrorSchema = z.object({
  error: z.object({
    message: z.string(),
  }),
});

// A helper function to handle API requests to SideShift with improved error handling
async function fetchSideShift<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const SIDESHIFT_SECRET = process.env.SIDESHIFT_SECRET;
  if (!SIDESHIFT_SECRET) {
    throw new Error("SIDESHIFT_SECRET is not set in .env");
  }

  const response = await fetch(`${SIDESHIFT_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-sideshift-secret': SIDESHIFT_SECRET,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `SideShift API Error: ${response.status} ${response.statusText}`;
    try {
      const data = await response.json();
      const parsedError = SideShiftErrorSchema.safeParse(data);
      if (parsedError.success) {
        errorMessage = `SideShift API Error: ${parsedError.data.error.message}`;
      }
    } catch (e) {
      // The response was not JSON, which can happen for various errors.
      errorMessage = `SideShift API Error: ${response.status} ${response.statusText}. Could not parse JSON response.`;
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}


// --- API Method Implementations ---

export const createShift = async (
  shiftData: {
    depositCoin: string;
    depositNetwork?: string;
    settleCoin: string;
    settleNetwork?: string;
    settleAmount: string;
    refundAddress?: string;
    refundMemo?: string;
    userIp?: string;
    externalId?: string;
  },
  affiliateId: string
) => {
  return fetchSideShift<any>('/shifts', {
    method: 'POST',
    body: JSON.stringify({
      ...shiftData,
      affiliateId,
      type: 'fixed',
    }),
  });
};

export const createQuote = (quoteData: any) => fetchSideShift<any>('/quotes', { method: 'POST', body: JSON.stringify(quoteData) });

export const createCheckout = (checkoutData: any, affiliateId: string) => fetchSideShift<any>('/checkouts', { method: 'POST', body: JSON.stringify({ ...checkoutData, affiliateId }) });

export const getPairs = (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return fetchSideShift<any>(`/pairs?${params.toString()}`);
};

export const getCoins = () => fetchSideShift<any>('/coins');

export const setupWebhook = (url: string) => fetchSideShift<any>('/webhooks', { method: 'POST', body: JSON.stringify({ url }) });
