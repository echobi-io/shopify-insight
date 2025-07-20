import { NextApiRequest, NextApiResponse } from 'next';
import { verifyWebhook, WebhookProcessors, WebhookRetryManager } from '@/lib/shopify/webhooks';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get raw body for webhook verification
    let rawBody: string;
    
    if (typeof req.body === 'string') {
      rawBody = req.body;
    } else {
      rawBody = JSON.stringify(req.body);
    }
    
    // Verify webhook authenticity
    const isValid = verifyWebhook(rawBody, req.headers);
    if (!isValid) {
      console.error('Invalid webhook signature for shop:', req.headers['x-shopify-shop-domain']);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract shop domain
    const shop = req.headers['x-shopify-shop-domain'] as string;
    
    if (!shop) {
      console.error('Missing shop domain in headers');
      return res.status(400).json({ error: 'Missing shop domain' });
    }

    // Validate shop domain format
    if (!shop.endsWith('.myshopify.com')) {
      console.error('Invalid shop domain format:', shop);
      return res.status(400).json({ error: 'Invalid shop domain' });
    }

    console.log(`Received app uninstall webhook from shop: ${shop}`);

    // Parse body if it's a string
    const webhookData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Process webhook with retry mechanism
    await WebhookRetryManager.processWithRetry(async () => {
      await WebhookProcessors.processAppUninstallWebhook(shop, webhookData);
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing app uninstall webhook:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}