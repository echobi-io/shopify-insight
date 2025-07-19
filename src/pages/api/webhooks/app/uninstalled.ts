import { NextApiRequest, NextApiResponse } from 'next';
import { verifyWebhook, WebhookProcessors, WebhookRetryManager } from '@/lib/shopify/webhooks';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get raw body for webhook verification
    const body = JSON.stringify(req.body);
    
    // Verify webhook authenticity
    const isValid = verifyWebhook(body, req.headers);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract shop domain
    const shop = req.headers['x-shopify-shop-domain'] as string;
    
    if (!shop) {
      console.error('Missing shop domain in headers');
      return res.status(400).json({ error: 'Missing shop domain' });
    }

    console.log(`Received app uninstall webhook from shop: ${shop}`);

    // Process webhook with retry mechanism
    await WebhookRetryManager.processWithRetry(async () => {
      await WebhookProcessors.processAppUninstallWebhook(shop, req.body);
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