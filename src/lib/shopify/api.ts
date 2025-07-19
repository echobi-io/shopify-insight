import { SessionManager, ShopifySession } from './auth';

export interface ShopifyOrder {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  closed_at?: string;
  processed_at: string;
  currency: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  total_discounts: string;
  financial_status: string;
  fulfillment_status?: string;
  customer?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    created_at: string;
  };
  line_items: Array<{
    id: number;
    product_id: number;
    variant_id: number;
    title: string;
    quantity: number;
    price: string;
    sku: string;
  }>;
  shipping_address?: {
    first_name: string;
    last_name: string;
    address1: string;
    city: string;
    province: string;
    country: string;
    zip: string;
  };
}

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  template_suffix?: string;
  status: string;
  published_scope: string;
  tags: string;
  variants: Array<{
    id: number;
    product_id: number;
    title: string;
    price: string;
    sku: string;
    position: number;
    inventory_policy: string;
    compare_at_price?: string;
    fulfillment_service: string;
    inventory_management: string;
    option1?: string;
    option2?: string;
    option3?: string;
    created_at: string;
    updated_at: string;
    taxable: boolean;
    barcode?: string;
    grams: number;
    image_id?: number;
    weight: number;
    weight_unit: string;
    inventory_item_id: number;
    inventory_quantity: number;
    old_inventory_quantity: number;
    requires_shipping: boolean;
  }>;
  images: Array<{
    id: number;
    product_id: number;
    position: number;
    created_at: string;
    updated_at: string;
    alt?: string;
    width: number;
    height: number;
    src: string;
    variant_ids: number[];
  }>;
}

export interface ShopifyCustomer {
  id: number;
  email: string;
  accepts_marketing: boolean;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  orders_count: number;
  state: string;
  total_spent: string;
  last_order_id?: number;
  note?: string;
  verified_email: boolean;
  multipass_identifier?: string;
  tax_exempt: boolean;
  phone?: string;
  tags: string;
  last_order_name?: string;
  currency: string;
  addresses: Array<{
    id: number;
    customer_id: number;
    first_name: string;
    last_name: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone?: string;
    name: string;
    province_code: string;
    country_code: string;
    country_name: string;
    default: boolean;
  }>;
}

export class ShopifyAPI {
  private shop: string;
  private accessToken: string;
  private baseUrl: string;

  constructor(shop: string, accessToken: string) {
    this.shop = shop;
    this.accessToken = accessToken;
    this.baseUrl = `https://${shop}/admin/api/2024-01`;
  }

  static async createFromSession(shop: string): Promise<ShopifyAPI | null> {
    const session = await SessionManager.getSession(shop);
    if (!session) return null;
    
    return new ShopifyAPI(session.shop, session.accessToken);
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify API Error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  // Orders API
  async getOrders(params?: {
    limit?: number;
    since_id?: string;
    created_at_min?: string;
    created_at_max?: string;
    updated_at_min?: string;
    updated_at_max?: string;
    processed_at_min?: string;
    processed_at_max?: string;
    status?: 'open' | 'closed' | 'cancelled' | 'any';
    financial_status?: 'authorized' | 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'voided' | 'partially_refunded' | 'any';
    fulfillment_status?: 'shipped' | 'partial' | 'unshipped' | 'any';
  }): Promise<{ orders: ShopifyOrder[] }> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/orders.json${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.makeRequest<{ orders: ShopifyOrder[] }>(endpoint);
  }

  async getOrder(orderId: number): Promise<{ order: ShopifyOrder }> {
    return this.makeRequest<{ order: ShopifyOrder }>(`/orders/${orderId}.json`);
  }

  async getOrdersCount(params?: {
    created_at_min?: string;
    created_at_max?: string;
    updated_at_min?: string;
    updated_at_max?: string;
    status?: 'open' | 'closed' | 'cancelled' | 'any';
    financial_status?: string;
    fulfillment_status?: string;
  }): Promise<{ count: number }> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/orders/count.json${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.makeRequest<{ count: number }>(endpoint);
  }

  // Products API
  async getProducts(params?: {
    limit?: number;
    since_id?: string;
    created_at_min?: string;
    created_at_max?: string;
    updated_at_min?: string;
    updated_at_max?: string;
    published_at_min?: string;
    published_at_max?: string;
    published_status?: 'published' | 'unpublished' | 'any';
    vendor?: string;
    product_type?: string;
  }): Promise<{ products: ShopifyProduct[] }> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/products.json${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.makeRequest<{ products: ShopifyProduct[] }>(endpoint);
  }

  async getProduct(productId: number): Promise<{ product: ShopifyProduct }> {
    return this.makeRequest<{ product: ShopifyProduct }>(`/products/${productId}.json`);
  }

  async getProductsCount(params?: {
    vendor?: string;
    product_type?: string;
    published_status?: 'published' | 'unpublished' | 'any';
  }): Promise<{ count: number }> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/products/count.json${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.makeRequest<{ count: number }>(endpoint);
  }

  // Customers API
  async getCustomers(params?: {
    limit?: number;
    since_id?: string;
    created_at_min?: string;
    created_at_max?: string;
    updated_at_min?: string;
    updated_at_max?: string;
  }): Promise<{ customers: ShopifyCustomer[] }> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/customers.json${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.makeRequest<{ customers: ShopifyCustomer[] }>(endpoint);
  }

  async getCustomer(customerId: number): Promise<{ customer: ShopifyCustomer }> {
    return this.makeRequest<{ customer: ShopifyCustomer }>(`/customers/${customerId}.json`);
  }

  async getCustomersCount(params?: {
    created_at_min?: string;
    created_at_max?: string;
    updated_at_min?: string;
    updated_at_max?: string;
  }): Promise<{ count: number }> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/customers/count.json${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.makeRequest<{ count: number }>(endpoint);
  }

  // Shop API
  async getShop(): Promise<{ shop: any }> {
    return this.makeRequest<{ shop: any }>('/shop.json');
  }

  // Analytics API (if available)
  async getAnalyticsReports(): Promise<any> {
    // This would require additional scopes and might not be available for all apps
    return this.makeRequest<any>('/analytics/reports.json');
  }

  // Utility methods
  async testConnection(): Promise<boolean> {
    try {
      await this.getShop();
      return true;
    } catch (error) {
      console.error('Shopify API connection test failed:', error);
      return false;
    }
  }

  async getRateLimitInfo(): Promise<{
    callLimit: number;
    callsRemaining: number;
    retryAfter?: number;
  }> {
    // This would be extracted from response headers in a real implementation
    // For now, return default values
    return {
      callLimit: 40,
      callsRemaining: 40
    };
  }
}

// Rate limiting utility
export class RateLimiter {
  private static requests: number[] = [];
  private static readonly MAX_REQUESTS = 40;
  private static readonly TIME_WINDOW = 1000; // 1 second

  static async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    
    // Remove requests older than the time window
    this.requests = this.requests.filter(time => now - time < this.TIME_WINDOW);
    
    if (this.requests.length >= this.MAX_REQUESTS) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.TIME_WINDOW - (now - oldestRequest);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    this.requests.push(now);
  }
}