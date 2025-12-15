// shiftkit-showcase/pages/api/webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

// In-memory store for webhook events (for demonstration purposes)
const webhookEvents: any[] = [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const signature = req.headers['sideshift-signature'] as string;
    const secret = process.env.SIDESHIFT_SECRET || '';

    // IMPORTANT: Verify the webhook signature to ensure it's from SideShift
    const hmac = crypto.createHmac('sha256', secret);
    // Note: SideShift sends a raw string body, not JSON.
    const rawBody = await new Promise<string>((resolve) => {
      let data = '';
      req.on('data', (chunk) => (data += chunk));
      req.on('end', () => resolve(data));
    });

    hmac.update(rawBody);
    const expectedSignature = hmac.digest('hex');

    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Store the event in our in-memory log
    webhookEvents.unshift({
      id: crypto.randomUUID(),
      data: JSON.parse(rawBody),
      receivedAt: new Date().toISOString(),
    });

    // Keep the log to a reasonable size
    if (webhookEvents.length > 20) {
      webhookEvents.pop();
    }

    return res.status(200).json({ message: 'Webhook received successfully' });
  }

  if (req.method === 'GET') {
    return res.status(200).json(webhookEvents);
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
