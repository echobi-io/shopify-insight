import { NextApiResponse } from 'next';
import { verifyWebhook, WebhookProcessors, WebhookRetryManager } from '@/lib/shopify/webhooks';
import { withRawBody, NextApiRequestWithRawBody } from '@/middleware/rawBody';

async function handler(req: NextApiRequestWithRawBody, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook authenticity using raw body
    const isValid = verifyWebhook(req.rawBody, req.headers);
    if (!isValid) {
      console.error('Invalid webhook signature for shop:', req.headers['x-shopify-shop-domain']);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract shop domain and topic
    const shop = req.headers['x-shopify-shop-domain'] as string;
    const topic = req.headers['x-shopify-topic'] as string;
    
    if (!shop || !topic) {
      console.error('Missing shop domain or topic in headers');
      return res.status(400).json({ error: 'Missing required headers' });
    }

    // Validate shop domain format
    if (!shop.endsWith('.myshopify.com')) {
      console.error('Invalid shop domain format:', shop);
      return res.status(400).json({ error: 'Invalid shop domain' });
    }

    console.log(`Received order webhook: ${topic} from shop: ${shop}`);

    // Use parsed body (already handled by middleware)
    const webhookData = req.body;

    // Process webhook with retry mechanism
    await WebhookRetryManager.processWithRetry(async () => {
      await WebhookProcessors.processOrderWebhook(shop, topic, webhookData);
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing order webhook:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Export with raw body middleware
export default withRawBody(handler);

// Disable Next.js body parser to handle raw body
export const config = {
  api: {
    bodyParser: false,
  },
}