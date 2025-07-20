import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Create a service role client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class ShopifyAuth {
  static generateInstallUrl(shop: string): string {
    const scopes = 'read_orders,read_products,read_customers,read_analytics,read_inventory,read_reports';
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/auth/shopify/callback`;
    const state = this.generateRandomState();
    
    // Store state in session for verification
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('shopify_oauth_state', state);
    }
    
    // Extract just the shop name without .myshopify.com if it's already included
    const shopName = shop.replace('.myshopify.com', '');
    
    return `https://${shopName}.myshopify.com/admin/oauth/authorize?` +
      `client_id=${process.env.NEXT_PUBLIC_SHOPIFY_API_KEY}&` +
      `scope=${scopes}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}`;
  }
  
  static async exchangeCodeForToken(shop: string, code: string): Promise<string> {
    // Extract just the shop name without .myshopify.com if it's already included
    const shopName = shop.replace('.myshopify.com', '');
    
    const response = await fetch(`https://${shopName}.myshopify.com/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to exchange code for token: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.access_token;
  }
  
  static generateRandomState(): string {
    return crypto.randomBytes(32).toString('hex');
  }
  
  static verifyState(receivedState: string): boolean {
    if (typeof window === 'undefined') return false;
    
    const storedState = sessionStorage.getItem('shopify_oauth_state');
    sessionStorage.removeItem('shopify_oauth_state');
    
    return storedState === receivedState;
  }
  
  static validateShopDomain(shop: string): boolean {
    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
    return shopRegex.test(shop);
  }
  
  static extractShopDomain(shop: string): string {
    // Remove protocol and trailing slash if present
    let cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // If it doesn't end with .myshopify.com, add it
    if (!cleanShop.endsWith('.myshopify.com')) {
      cleanShop = `${cleanShop}.myshopify.com`;
    }
    
    return cleanShop;
  }
}

export interface ShopifySession {
  shop: string;
  accessToken: string;
  scope: string;
  expires?: Date;
  isActive: boolean;
}

export class SessionManager {
  static async createSession(shop: string, accessToken: string, scope: string): Promise<void> {
    try {
      // Store in database
      const { error } = await supabase.from('shops').upsert({
        shop_domain: shop,
        access_token: accessToken,
        scope: scope,
        updated_at: new Date().toISOString(),
        is_active: true
      });
      
      if (error) {
        console.error('Error creating session:', error);
        throw error;
      }
      
      // Store in localStorage for quick access
      if (typeof window !== 'undefined') {
        localStorage.setItem('shopify_session', JSON.stringify({
          shop,
          accessToken,
          scope,
          isActive: true
        }));
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }
  
  static async getSession(shop: string): Promise<ShopifySession | null> {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('shop_domain', shop)
        .eq('is_active', true)
        .single();
      
      if (error || !data) {
        console.error('Error getting session:', error);
        return null;
      }
      
      return {
        shop: data.shop_domain,
        accessToken: data.access_token,
        scope: data.scope,
        isActive: data.is_active
      };
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }
  
  static async getCurrentSession(): Promise<ShopifySession | null> {
    // First try to get from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('shopify_session');
      if (stored) {
        try {
          const session = JSON.parse(stored);
          // Verify session is still valid in database
          const dbSession = await this.getSession(session.shop);
          return dbSession;
        } catch (error) {
          console.error('Error parsing stored session:', error);
          localStorage.removeItem('shopify_session');
        }
      }
    }
    
    return null;
  }
  
  static async deleteSession(shop: string): Promise<void> {
    try {
      // Mark as inactive in database
      const { error } = await supabase
        .from('shops')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('shop_domain', shop);
      
      if (error) {
        console.error('Error deleting session:', error);
      }
      
      // Remove from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('shopify_session');
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }
  
  static clearAllSessions(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shopify_session');
      sessionStorage.removeItem('shopify_oauth_state');
    }
  }
}