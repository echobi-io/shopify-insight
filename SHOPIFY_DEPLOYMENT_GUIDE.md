# echoSignal - Shopify App Store Deployment Guide

## Overview
This guide outlines the complete deployment pipeline for echoSignal to be published on the Shopify App Store. The app provides AI-powered analytics, predictive insights, and comprehensive data visualization for Shopify merchants.

## Architecture Overview

### Current State
- **Framework**: Next.js 14 with React 18
- **Authentication**: Supabase Auth (needs to be replaced with Shopify OAuth)
- **Database**: Supabase PostgreSQL
- **Styling**: Tailwind CSS with shadcn/ui components
- **Charts**: Recharts
- **AI**: OpenAI integration

### Target State (Shopify App)
- **Framework**: Next.js 14 with Shopify App Bridge
- **Authentication**: Shopify OAuth 2.0
- **Database**: Supabase PostgreSQL (multi-tenant)
- **Webhooks**: Shopify webhook handling
- **API**: Shopify Admin API integration
- **Deployment**: Vercel/Railway with custom domain

## Phase 1: Shopify App Foundation

### 1.1 App Registration & Configuration
1. **Create Shopify Partner Account**
   - Register at partners.shopify.com
   - Create new app in Partner Dashboard
   - Configure app settings and URLs

2. **App Manifest Configuration**
   ```toml
   # shopify.app.toml
   name = "echoSignal"
   client_id = "your_client_id"
   application_url = "https://echosignal.app"
   embedded = true
   
   [access_scopes]
   scopes = "read_orders,read_products,read_customers,read_analytics"
   
   [auth]
   redirect_urls = [
     "https://echosignal.app/auth/shopify/callback"
   ]
   
   [webhooks]
   api_version = "2024-01"
   
   [[webhooks.subscriptions]]
   topics = ["orders/create", "orders/updated", "orders/paid"]
   uri = "https://echosignal.app/api/webhooks/orders"
   
   [[webhooks.subscriptions]]
   topics = ["customers/create", "customers/update"]
   uri = "https://echosignal.app/api/webhooks/customers"
   
   [[webhooks.subscriptions]]
   topics = ["products/create", "products/update"]
   uri = "https://echosignal.app/api/webhooks/products"
   ```

### 1.2 Required Shopify Scopes
- `read_orders` - Access order data for analytics
- `read_products` - Access product information
- `read_customers` - Access customer data
- `read_analytics` - Access Shopify Analytics API
- `read_inventory` - Access inventory levels
- `read_reports` - Access additional reporting data

### 1.3 Database Schema Updates
```sql
-- Add shop/merchant management
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  plan_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true
);

-- Add webhook tracking
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id),
  topic VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update existing tables to include shop_id
ALTER TABLE orders ADD COLUMN shop_id UUID REFERENCES shops(id);
ALTER TABLE customers ADD COLUMN shop_id UUID REFERENCES shops(id);
ALTER TABLE products ADD COLUMN shop_id UUID REFERENCES shops(id);
```

## Phase 2: Authentication & Authorization

### 2.1 Shopify OAuth Implementation
Replace current Supabase auth with Shopify OAuth:

```typescript
// src/lib/shopify/auth.ts
export class ShopifyAuth {
  static generateInstallUrl(shop: string): string {
    const scopes = 'read_orders,read_products,read_customers,read_analytics';
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/auth/shopify/callback`;
    const state = generateRandomState();
    
    return `https://${shop}.myshopify.com/admin/oauth/authorize?` +
      `client_id=${process.env.SHOPIFY_API_KEY}&` +
      `scope=${scopes}&` +
      `redirect_uri=${redirectUri}&` +
      `state=${state}`;
  }
  
  static async exchangeCodeForToken(shop: string, code: string): Promise<string> {
    const response = await fetch(`https://${shop}.myshopify.com/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code
      })
    });
    
    const data = await response.json();
    return data.access_token;
  }
}
```

### 2.2 Session Management
```typescript
// src/lib/shopify/session.ts
export interface ShopifySession {
  shop: string;
  accessToken: string;
  scope: string;
  expires?: Date;
}

export class SessionManager {
  static async createSession(shop: string, accessToken: string, scope: string): Promise<void> {
    // Store in database
    await supabase.from('shops').upsert({
      shop_domain: shop,
      access_token: accessToken,
      scope: scope,
      updated_at: new Date().toISOString()
    });
  }
  
  static async getSession(shop: string): Promise<ShopifySession | null> {
    const { data } = await supabase
      .from('shops')
      .select('*')
      .eq('shop_domain', shop)
      .single();
    
    if (!data) return null;
    
    return {
      shop: data.shop_domain,
      accessToken: data.access_token,
      scope: data.scope
    };
  }
}
```

## Phase 3: Data Synchronization

### 3.1 Shopify API Integration
```typescript
// src/lib/shopify/api.ts
export class ShopifyAPI {
  constructor(private shop: string, private accessToken: string) {}
  
  async getOrders(params?: {
    limit?: number;
    since_id?: string;
    created_at_min?: string;
    created_at_max?: string;
  }) {
    const url = new URL(`https://${this.shop}.myshopify.com/admin/api/2024-01/orders.json`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value.toString());
      });
    }
    
    const response = await fetch(url.toString(), {
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    return response.json();
  }
  
  async getProducts(params?: { limit?: number; since_id?: string }) {
    // Similar implementation for products
  }
  
  async getCustomers(params?: { limit?: number; since_id?: string }) {
    // Similar implementation for customers
  }
}
```

### 3.2 Data Sync Service
```typescript
// src/lib/services/syncService.ts
export class DataSyncService {
  static async syncShopData(shop: string): Promise<void> {
    const session = await SessionManager.getSession(shop);
    if (!session) throw new Error('No session found');
    
    const api = new ShopifyAPI(session.shop, session.accessToken);
    
    // Sync orders
    await this.syncOrders(api, shop);
    
    // Sync products
    await this.syncProducts(api, shop);
    
    // Sync customers
    await this.syncCustomers(api, shop);
  }
  
  private static async syncOrders(api: ShopifyAPI, shop: string): Promise<void> {
    let hasMore = true;
    let sinceId: string | undefined;
    
    while (hasMore) {
      const response = await api.getOrders({ 
        limit: 250, 
        since_id: sinceId 
      });
      
      const orders = response.orders;
      if (orders.length === 0) break;
      
      // Transform and insert orders
      await this.insertOrders(orders, shop);
      
      sinceId = orders[orders.length - 1].id;
      hasMore = orders.length === 250;
    }
  }
}
```

## Phase 4: Webhook Handling

### 4.1 Webhook Endpoints
```typescript
// src/pages/api/webhooks/orders.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyWebhook } from '@/lib/shopify/webhooks';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const isValid = verifyWebhook(req.body, req.headers);
  if (!isValid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const order = req.body;
  const shop = req.headers['x-shopify-shop-domain'] as string;
  
  // Process order webhook
  await processOrderWebhook(order, shop);
  
  res.status(200).json({ success: true });
}
```

### 4.2 Webhook Verification
```typescript
// src/lib/shopify/webhooks.ts
import crypto from 'crypto';

export function verifyWebhook(body: any, headers: any): boolean {
  const hmac = headers['x-shopify-hmac-sha256'];
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('base64');
  
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmac));
}
```

## Phase 5: App Bridge Integration

### 5.1 App Bridge Setup
```typescript
// src/lib/shopify/appBridge.ts
import { createApp } from '@shopify/app-bridge';
import { Redirect } from '@shopify/app-bridge/actions';

export function initializeAppBridge() {
  const app = createApp({
    apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
    host: new URLSearchParams(window.location.search).get('host')!,
  });
  
  return app;
}

export function redirectToShopifyAdmin(path: string) {
  const app = initializeAppBridge();
  const redirect = Redirect.create(app);
  redirect.dispatch(Redirect.Action.ADMIN_PATH, path);
}
```

### 5.2 Embedded App Layout
```typescript
// src/components/ShopifyAppLayout.tsx
import { useEffect, useState } from 'react';
import { initializeAppBridge } from '@/lib/shopify/appBridge';

export function ShopifyAppLayout({ children }: { children: React.ReactNode }) {
  const [app, setApp] = useState(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const appBridge = initializeAppBridge();
      setApp(appBridge);
    }
  }, []);
  
  return (
    <div className="shopify-app">
      {children}
    </div>
  );
}
```

## Phase 6: Multi-tenancy & Data Isolation

### 6.1 Shop Context Provider
```typescript
// src/contexts/ShopContext.tsx
export const ShopContext = createContext<{
  shop: string | null;
  session: ShopifySession | null;
}>({
  shop: null,
  session: null
});

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [shop, setShop] = useState<string | null>(null);
  const [session, setSession] = useState<ShopifySession | null>(null);
  
  useEffect(() => {
    // Get shop from URL params or session
    const urlParams = new URLSearchParams(window.location.search);
    const shopParam = urlParams.get('shop');
    
    if (shopParam) {
      setShop(shopParam);
      // Load session for this shop
      loadShopSession(shopParam);
    }
  }, []);
  
  return (
    <ShopContext.Provider value={{ shop, session }}>
      {children}
    </ShopContext.Provider>
  );
}
```

### 6.2 Data Fetcher Updates
All data fetchers need to be updated to include shop context:

```typescript
// Example: src/lib/fetchers/getDashboardData.ts
export async function getDashboardData(shop: string, dateRange: DateRange) {
  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('shop_id', shop)
    .gte('created_at', dateRange.from)
    .lte('created_at', dateRange.to);
  
  return data;
}
```

## Phase 7: Deployment Infrastructure

### 7.1 Environment Variables
```bash
# Shopify App Configuration
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_SHOPIFY_API_KEY=your_api_key

# App URLs
NEXT_PUBLIC_APP_URL=https://echosignal.app
SHOPIFY_APP_URL=https://echosignal.app

# Database (existing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
DATABASE_URL=your_database_url

# AI Integration (existing)
OPENAI_API_KEY=your_openai_key
```

### 7.2 Vercel Deployment Configuration
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/webhooks/(.*)",
      "dest": "/api/webhooks/$1"
    }
  ],
  "env": {
    "SHOPIFY_API_KEY": "@shopify-api-key",
    "SHOPIFY_API_SECRET": "@shopify-api-secret",
    "SHOPIFY_WEBHOOK_SECRET": "@shopify-webhook-secret"
  }
}
```

### 7.3 CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build application
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Phase 8: App Store Submission

### 8.1 App Store Requirements Checklist
- [ ] App functionality works in embedded mode
- [ ] Proper error handling and loading states
- [ ] GDPR compliance for EU merchants
- [ ] Responsive design for mobile
- [ ] App uninstall webhook handling
- [ ] Privacy policy and terms of service
- [ ] App listing assets (screenshots, videos, descriptions)

### 8.2 App Listing Content
```markdown
# App Store Listing

**Title**: echoSignal - AI-Powered Analytics

**Subtitle**: Advanced analytics and insights for your Shopify store

**Description**: 
Transform your Shopify store data into actionable insights with echoSignal. Our AI-powered analytics platform provides comprehensive dashboards, predictive analytics, and detailed reports to help you understand your customers, optimize your products, and grow your business.

**Key Features**:
- Real-time sales and revenue analytics
- Customer behavior and churn prediction
- Product performance insights
- Cohort analysis and retention tracking
- AI-powered business recommendations
- Advanced reporting and data export

**Pricing**: 
- Free: Up to 100 orders/month
- Pro ($29/month): Up to 10,000 orders/month
- Enterprise ($99/month): Unlimited orders + priority support
```

### 8.3 Testing Checklist
- [ ] Install flow works correctly
- [ ] Data syncs properly from Shopify
- [ ] All analytics features function
- [ ] Webhooks process correctly
- [ ] App uninstall cleans up data
- [ ] Performance under load
- [ ] Mobile responsiveness
- [ ] Error handling and recovery

## Phase 9: Monitoring & Maintenance

### 9.1 Application Monitoring
```typescript
// src/lib/monitoring/analytics.ts
export class AppAnalytics {
  static trackInstall(shop: string) {
    // Track app installations
  }
  
  static trackFeatureUsage(shop: string, feature: string) {
    // Track feature usage
  }
  
  static trackError(error: Error, context: any) {
    // Track errors for debugging
  }
}
```

### 9.2 Health Checks
```typescript
// src/pages/api/health.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check database connection
    await supabase.from('shops').select('count').single();
    
    // Check external services
    // ... other health checks
    
    res.status(200).json({ status: 'healthy' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
}
```

## Implementation Timeline

### Week 1-2: Foundation
- Set up Shopify Partner account and app
- Implement OAuth flow
- Update database schema
- Basic webhook handling

### Week 3-4: Data Integration
- Shopify API integration
- Data sync service
- Update all data fetchers
- Multi-tenancy implementation

### Week 5-6: App Bridge & UI
- Implement App Bridge
- Update authentication flow
- Test embedded app experience
- Mobile optimization

### Week 7-8: Testing & Polish
- Comprehensive testing
- Performance optimization
- Error handling improvements
- Documentation

### Week 9-10: Submission
- App store listing preparation
- Final testing and review
- Submit to Shopify App Store
- Monitor review process

## Success Metrics
- App installation rate
- User engagement and retention
- Feature adoption rates
- Customer satisfaction scores
- Revenue growth for merchants using the app

This deployment pipeline transforms echoSignal from a standalone analytics tool into a fully-featured Shopify app ready for the App Store.