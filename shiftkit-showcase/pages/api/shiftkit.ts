// shiftkit-showcase/pages/api/shiftkit.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { ShiftKit, APIError, NetworkError } from '../../lib/shiftkit';

// This is a critical step: initialize the SDK on the server-side.
// The secret and affiliate ID are pulled from environment variables, ensuring they are never exposed to the client.
const shiftKit = new ShiftKit({
  secret: process.env.SIDESHIFT_SECRET || '',
  affiliateId: process.env.SIDESHIFT_AFFILIATE_ID || '',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // We'll use a single API route and differentiate actions based on a query parameter.
  const { action, params } = req.body;

  try {
    switch (action) {
      case 'getCoins':
        const coins = await shiftKit.getCoins();
        return res.status(200).json(coins);

      case 'performFixedSwap':
        const shift = await shiftKit.performFixedSwap(params);
        return res.status(200).json(shift);

      case 'getShift':
        if (typeof params.id !== 'string') {
          return res.status(400).json({ error: 'Shift ID must be a string' });
        }
        const shiftStatus = await shiftKit.getShift(params.id);
        return res.status(200).json(shiftStatus);

      case 'createVariableShift':
        const variableShift = await shiftKit.createVariableShift(params);
        return res.status(200).json(variableShift);

      case 'createCheckout':
        const checkout = await shiftKit.createCheckout(params);
        return res.status(200).json(checkout);

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    if (error instanceof APIError) {
      return res.status(error.status).json({ error: error.message, details: error.response });
    }
    if (error instanceof NetworkError) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}
