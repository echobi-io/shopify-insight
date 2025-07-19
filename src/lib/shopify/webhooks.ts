import crypto from 'crypto';
import { createClient } from '@/util/supabase/component';
import { DataSyncService } from '../services/syncService';

const supabase = createClient();

export function verifyWebhook(body: string, headers: any): boolean {
  const hmac = headers['x-shopify-hmac-sha256'];
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  
  if (!hmac || !secret) {
    console.error('Missing HMAC or webhook secret');
    return false;
  }
  
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
  
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmac));
}

export async function logWebhookEvent(
  shop: string,
  topic: string,
  payload: any
): Promise<void> {
  try {
    // Get shop ID
    const { data: shopData } = await supabase
      .from('shops')
      .select('id')
      .eq('shop_domain', shop)
      .single();

    if (!shopData) {
      console.error('Shop not found for webhook:', shop);
      return;
    }

    // Log the webhook event
    const { error } = await supabase
      .from('webhook_events')
      .insert({
        shop_id: shopData.id,
        topic,
        payload,
        processed: false
      });

    if (error) {
      console.error('Error logging webhook event:', error);
    }
  } catch (error) {
    console.error('Failed to log webhook event:', error);
  }
}

export async function markWebhookProcessed(eventId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('webhook_events')
      .update({ processed: true })
      .eq('id', eventId);

    if (error) {
      console.error('Error marking webhook as processed:', error);
    }
  } catch (error) {
    console.error('Failed to mark webhook as processed:', error);
  }
}

// Webhook processors
export class WebhookProcessors {
  static async processOrderWebhook(
    shop: string,
    topic: string,
    order: any
  ): Promise<void> {
    try {
      console.log(`Processing order webhook: ${topic} for shop: ${shop}`);
      
      // Log the webhook
      await logWebhookEvent(shop, topic, order);
      
      // Process based on topic
      switch (topic) {
        case 'orders/create':
        case 'orders/updated':
        case 'orders/paid':
          await DataSyncService.syncSingleOrder(shop, order.id);
          break;
        
        case 'orders/cancelled':
          // Handle order cancellation
          await DataSyncService.syncSingleOrder(shop, order.id);
          break;
        
        default:
          console.log(`Unhandled order webhook topic: ${topic}`);
      }
    } catch (error) {
      console.error('Error processing order webhook:', error);
      throw error;
    }
  }

  static async processCustomerWebhook(
    shop: string,
    topic: string,
    customer: any
  ): Promise<void> {
    try {
      console.log(`Processing customer webhook: ${topic} for shop: ${shop}`);
      
      // Log the webhook
      await logWebhookEvent(shop, topic, customer);
      
      // Process based on topic
      switch (topic) {
        case 'customers/create':
        case 'customers/update':
          await DataSyncService.syncSingleCustomer(shop, customer.id);
          break;
        
        default:
          console.log(`Unhandled customer webhook topic: ${topic}`);
      }
    } catch (error) {
      console.error('Error processing customer webhook:', error);
      throw error;
    }
  }

  static async processProductWebhook(
    shop: string,
    topic: string,
    product: any
  ): Promise<void> {
    try {
      console.log(`Processing product webhook: ${topic} for shop: ${shop}`);
      
      // Log the webhook
      await logWebhookEvent(shop, topic, product);
      
      // Process based on topic
      switch (topic) {
        case 'products/create':
        case 'products/update':
          await DataSyncService.syncSingleProduct(shop, product.id);
          break;
        
        default:
          console.log(`Unhandled product webhook topic: ${topic}`);
      }
    } catch (error) {
      console.error('Error processing product webhook:', error);
      throw error;
    }
  }

  static async processAppUninstallWebhook(
    shop: string,
    payload: any
  ): Promise<void> {
    try {
      console.log(`Processing app uninstall webhook for shop: ${shop}`);
      
      // Log the webhook
      await logWebhookEvent(shop, 'app/uninstalled', payload);
      
      // Mark shop as inactive
      const { error } = await supabase
        .from('shops')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('shop_domain', shop);

      if (error) {
        console.error('Error marking shop as inactive:', error);
        throw error;
      }

      // Optionally, you might want to:
      // 1. Clean up shop data (depending on your data retention policy)
      // 2. Send notification to your team
      // 3. Update billing/subscription status
      
      console.log(`Shop ${shop} marked as inactive due to app uninstall`);
    } catch (error) {
      console.error('Error processing app uninstall webhook:', error);
      throw error;
    }
  }
}

// Webhook retry mechanism
export class WebhookRetryManager {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s

  static async processWithRetry(
    processor: () => Promise<void>,
    retryCount = 0
  ): Promise<void> {
    try {
      await processor();
    } catch (error) {
      console.error(`Webhook processing failed (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < this.MAX_RETRIES) {
        const delay = this.RETRY_DELAYS[retryCount] || 15000;
        console.log(`Retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.processWithRetry(processor, retryCount + 1);
      } else {
        console.error('Max retries exceeded, webhook processing failed permanently');
        throw error;
      }
    }
  }
}

// Webhook queue for handling high-volume webhooks
export class WebhookQueue {
  private static queue: Array<{
    id: string;
    shop: string;
    topic: string;
    payload: any;
    timestamp: number;
  }> = [];
  
  private static processing = false;

  static async enqueue(shop: string, topic: string, payload: any): Promise<void> {
    const webhookEvent = {
      id: crypto.randomUUID(),
      shop,
      topic,
      payload,
      timestamp: Date.now()
    };

    this.queue.push(webhookEvent);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
  }

  private static async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (!event) continue;

      try {
        await this.processWebhookEvent(event);
      } catch (error) {
        console.error('Error processing queued webhook:', error);
        // Optionally re-queue or send to dead letter queue
      }
    }

    this.processing = false;
  }

  private static async processWebhookEvent(event: {
    shop: string;
    topic: string;
    payload: any;
  }): Promise<void> {
    const { shop, topic, payload } = event;

    if (topic.startsWith('orders/')) {
      await WebhookProcessors.processOrderWebhook(shop, topic, payload);
    } else if (topic.startsWith('customers/')) {
      await WebhookProcessors.processCustomerWebhook(shop, topic, payload);
    } else if (topic.startsWith('products/')) {
      await WebhookProcessors.processProductWebhook(shop, topic, payload);
    } else if (topic === 'app/uninstalled') {
      await WebhookProcessors.processAppUninstallWebhook(shop, payload);
    } else {
      console.log(`Unhandled webhook topic: ${topic}`);
    }
  }

  static getQueueLength(): number {
    return this.queue.length;
  }

  static isProcessing(): boolean {
    return this.processing;
  }
}