import { ShopifyAPI, ShopifyOrder, ShopifyProduct, ShopifyCustomer, RateLimiter } from '../shopify/api';
import { SessionManager } from '../shopify/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface SyncProgress {
  stage: 'orders' | 'products' | 'customers' | 'complete';
  processed: number;
  total: number;
  errors: string[];
}

export class DataSyncService {
  private static syncInProgress = new Map<string, boolean>();
  private static progressCallbacks = new Map<string, (progress: SyncProgress) => void>();

  static async syncShopData(
    shop: string, 
    onProgress?: (progress: SyncProgress) => void
  ): Promise<void> {
    // Prevent multiple syncs for the same shop
    if (this.syncInProgress.get(shop)) {
      throw new Error('Sync already in progress for this shop');
    }

    this.syncInProgress.set(shop, true);
    if (onProgress) {
      this.progressCallbacks.set(shop, onProgress);
    }

    try {
      const session = await SessionManager.getSession(shop);
      if (!session) {
        throw new Error('No valid session found for shop');
      }

      const api = new ShopifyAPI(session.shop, session.accessToken);

      // Test connection first
      const isConnected = await api.testConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to Shopify API');
      }

      // Get shop ID from database
      const shopId = await this.getOrCreateShopId(shop);

      // Sync in order: customers, products, then orders (orders depend on customers and products)
      await this.syncCustomers(api, shopId, shop);
      await this.syncProducts(api, shopId, shop);
      await this.syncOrders(api, shopId, shop);

      // Mark sync as complete
      this.reportProgress(shop, {
        stage: 'complete',
        processed: 0,
        total: 0,
        errors: []
      });

    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      this.syncInProgress.delete(shop);
      this.progressCallbacks.delete(shop);
    }
  }

  private static async getOrCreateShopId(shop: string): Promise<string> {
    const { data, error } = await supabase
      .from('shops')
      .select('id')
      .eq('shop_domain', shop)
      .single();

    if (error || !data) {
      throw new Error('Shop not found in database');
    }

    return data.id;
  }

  private static reportProgress(shop: string, progress: SyncProgress): void {
    const callback = this.progressCallbacks.get(shop);
    if (callback) {
      callback(progress);
    }
  }

  private static async syncCustomers(api: ShopifyAPI, shopId: string, shop: string): Promise<void> {
    console.log('Starting customer sync...');
    
    // Get total count first
    const { count: totalCustomers } = await api.getCustomersCount();
    let processed = 0;
    const errors: string[] = [];

    this.reportProgress(shop, {
      stage: 'customers',
      processed,
      total: totalCustomers,
      errors
    });

    let hasMore = true;
    let sinceId: string | undefined;

    while (hasMore) {
      try {
        await RateLimiter.waitIfNeeded();
        
        const response = await api.getCustomers({ 
          limit: 250, 
          since_id: sinceId 
        });
        
        const customers = response.customers;
        if (customers.length === 0) break;

        // Transform and insert customers
        await this.insertCustomers(customers, shopId);
        
        processed += customers.length;
        sinceId = customers[customers.length - 1].id.toString();
        hasMore = customers.length === 250;

        this.reportProgress(shop, {
          stage: 'customers',
          processed,
          total: totalCustomers,
          errors
        });

      } catch (error) {
        console.error('Error syncing customers batch:', error);
        errors.push(`Customer sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        break;
      }
    }

    console.log(`Customer sync complete: ${processed}/${totalCustomers}`);
  }

  private static async syncProducts(api: ShopifyAPI, shopId: string, shop: string): Promise<void> {
    console.log('Starting product sync...');
    
    // Get total count first
    const { count: totalProducts } = await api.getProductsCount();
    let processed = 0;
    const errors: string[] = [];

    this.reportProgress(shop, {
      stage: 'products',
      processed,
      total: totalProducts,
      errors
    });

    let hasMore = true;
    let sinceId: string | undefined;

    while (hasMore) {
      try {
        await RateLimiter.waitIfNeeded();
        
        const response = await api.getProducts({ 
          limit: 250, 
          since_id: sinceId 
        });
        
        const products = response.products;
        if (products.length === 0) break;

        // Transform and insert products
        await this.insertProducts(products, shopId);
        
        processed += products.length;
        sinceId = products[products.length - 1].id.toString();
        hasMore = products.length === 250;

        this.reportProgress(shop, {
          stage: 'products',
          processed,
          total: totalProducts,
          errors
        });

      } catch (error) {
        console.error('Error syncing products batch:', error);
        errors.push(`Product sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        break;
      }
    }

    console.log(`Product sync complete: ${processed}/${totalProducts}`);
  }

  private static async syncOrders(api: ShopifyAPI, shopId: string, shop: string): Promise<void> {
    console.log('Starting order sync...');
    
    // Get total count first
    const { count: totalOrders } = await api.getOrdersCount({ status: 'any' });
    let processed = 0;
    const errors: string[] = [];

    this.reportProgress(shop, {
      stage: 'orders',
      processed,
      total: totalOrders,
      errors
    });

    let hasMore = true;
    let sinceId: string | undefined;

    while (hasMore) {
      try {
        await RateLimiter.waitIfNeeded();
        
        const response = await api.getOrders({ 
          limit: 250, 
          since_id: sinceId,
          status: 'any'
        });
        
        const orders = response.orders;
        if (orders.length === 0) break;

        // Transform and insert orders
        await this.insertOrders(orders, shopId);
        
        processed += orders.length;
        sinceId = orders[orders.length - 1].id.toString();
        hasMore = orders.length === 250;

        this.reportProgress(shop, {
          stage: 'orders',
          processed,
          total: totalOrders,
          errors
        });

      } catch (error) {
        console.error('Error syncing orders batch:', error);
        errors.push(`Order sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        break;
      }
    }

    console.log(`Order sync complete: ${processed}/${totalOrders}`);
  }

  private static async insertCustomers(customers: ShopifyCustomer[], shopId: string): Promise<void> {
    const customerData = customers.map(customer => ({
      id: customer.id.toString(),
      shop_id: shopId,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      accepts_marketing: customer.accepts_marketing,
      created_at: customer.created_at,
      updated_at: customer.updated_at,
      orders_count: customer.orders_count,
      total_spent: parseFloat(customer.total_spent),
      tags: customer.tags,
      state: customer.state,
      verified_email: customer.verified_email,
      tax_exempt: customer.tax_exempt,
      currency: customer.currency
    }));

    const { error } = await supabase
      .from('customers')
      .upsert(customerData, { onConflict: 'id' });

    if (error) {
      console.error('Error inserting customers:', error);
      throw error;
    }
  }

  private static async insertProducts(products: ShopifyProduct[], shopId: string): Promise<void> {
    const productData = products.map(product => ({
      id: product.id.toString(),
      shop_id: shopId,
      title: product.title,
      body_html: product.body_html,
      vendor: product.vendor,
      product_type: product.product_type,
      created_at: product.created_at,
      updated_at: product.updated_at,
      published_at: product.published_at,
      status: product.status,
      tags: product.tags,
      // Store variants and images as JSON
      variants: JSON.stringify(product.variants),
      images: JSON.stringify(product.images)
    }));

    const { error } = await supabase
      .from('products')
      .upsert(productData, { onConflict: 'id' });

    if (error) {
      console.error('Error inserting products:', error);
      throw error;
    }
  }

  private static async insertOrders(orders: ShopifyOrder[], shopId: string): Promise<void> {
    const orderData = orders.map(order => ({
      id: order.id.toString(),
      shop_id: shopId,
      name: order.name,
      email: order.email,
      created_at: order.created_at,
      updated_at: order.updated_at,
      cancelled_at: order.cancelled_at,
      closed_at: order.closed_at,
      processed_at: order.processed_at,
      currency: order.currency,
      total_price: parseFloat(order.total_price),
      subtotal_price: parseFloat(order.subtotal_price),
      total_tax: parseFloat(order.total_tax),
      total_discounts: parseFloat(order.total_discounts),
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      customer_id: order.customer?.id?.toString(),
      // Store line items and shipping address as JSON
      line_items: JSON.stringify(order.line_items),
      shipping_address: order.shipping_address ? JSON.stringify(order.shipping_address) : null
    }));

    const { error } = await supabase
      .from('orders')
      .upsert(orderData, { onConflict: 'id' });

    if (error) {
      console.error('Error inserting orders:', error);
      throw error;
    }
  }

  // Incremental sync methods for webhook updates
  static async syncSingleOrder(shop: string, orderId: number): Promise<void> {
    const session = await SessionManager.getSession(shop);
    if (!session) return;

    const api = new ShopifyAPI(session.shop, session.accessToken);
    const shopId = await this.getOrCreateShopId(shop);

    try {
      const { order } = await api.getOrder(orderId);
      await this.insertOrders([order], shopId);
    } catch (error) {
      console.error('Error syncing single order:', error);
    }
  }

  static async syncSingleProduct(shop: string, productId: number): Promise<void> {
    const session = await SessionManager.getSession(shop);
    if (!session) return;

    const api = new ShopifyAPI(session.shop, session.accessToken);
    const shopId = await this.getOrCreateShopId(shop);

    try {
      const { product } = await api.getProduct(productId);
      await this.insertProducts([product], shopId);
    } catch (error) {
      console.error('Error syncing single product:', error);
    }
  }

  static async syncSingleCustomer(shop: string, customerId: number): Promise<void> {
    const session = await SessionManager.getSession(shop);
    if (!session) return;

    const api = new ShopifyAPI(session.shop, session.accessToken);
    const shopId = await this.getOrCreateShopId(shop);

    try {
      const { customer } = await api.getCustomer(customerId);
      await this.insertCustomers([customer], shopId);
    } catch (error) {
      console.error('Error syncing single customer:', error);
    }
  }

  // Utility methods
  static isSyncInProgress(shop: string): boolean {
    return this.syncInProgress.get(shop) || false;
  }

  static async getLastSyncTime(shop: string): Promise<Date | null> {
    const { data, error } = await supabase
      .from('shops')
      .select('updated_at')
      .eq('shop_domain', shop)
      .single();

    if (error || !data) return null;
    return new Date(data.updated_at);
  }
}