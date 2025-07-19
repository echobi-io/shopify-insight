# Shopify Data Synchronization & API Limit Management

## Overview

The echoSignal application implements a comprehensive strategy for handling initial data synchronization from Shopify stores while respecting API rate limits and ensuring optimal performance.

## Initial Data Synchronization Strategy

### 1. OAuth Flow & First-Time Setup

When a merchant installs the app:

1. **OAuth Authentication** (`src/lib/shopify/auth.ts`)
   - Merchant clicks install → redirected to Shopify OAuth
   - App exchanges authorization code for access token
   - Session stored in database with shop details

2. **Automatic Initial Sync** (`src/pages/auth/shopify/callback.ts`)
   - After successful OAuth, triggers initial data sync
   - Syncs in order: Customers → Products → Orders (dependencies)
   - Progress reported to user in real-time

### 2. Data Sync Service Architecture

**Service Location**: `src/lib/services/syncService.ts`

**Sync Order & Rationale**:
```
1. Customers (independent)
2. Products (independent) 
3. Orders (depends on customers & products)
```

**Batch Processing**:
- Fetches data in batches of 250 records (Shopify's max)
- Uses `since_id` pagination for efficient incremental updates
- Processes batches sequentially to respect rate limits

### 3. API Rate Limit Management

**Rate Limiter Implementation** (`src/lib/shopify/api.ts`):

```typescript
class RateLimiter {
  private static requests: number[] = []
  private static readonly MAX_REQUESTS = 40
  private static readonly TIME_WINDOW = 1000 // 1 second

  static async waitIfNeeded(): Promise<void> {
    // Tracks requests in sliding window
    // Automatically delays if approaching limits
  }
}
```

**Key Features**:
- **Sliding Window**: Tracks requests over 1-second windows
- **Proactive Throttling**: Waits before hitting limits
- **Exponential Backoff**: Increases delays on retries
- **Request Queuing**: Manages high-volume operations

### 4. Handling Large Datasets

**Pagination Strategy**:
```typescript
// Example from syncService.ts
let hasMore = true
let sinceId: string | undefined

while (hasMore) {
  await RateLimiter.waitIfNeeded()
  
  const response = await api.getOrders({ 
    limit: 250, 
    since_id: sinceId 
  })
  
  // Process batch
  await this.insertOrders(orders, shopId)
  
  // Setup for next batch
  sinceId = orders[orders.length - 1].id.toString()
  hasMore = orders.length === 250
}
```

**Database Optimization**:
- **Upsert Operations**: Handles duplicates gracefully
- **Batch Inserts**: Reduces database round trips
- **Shop Isolation**: Row Level Security (RLS) for multi-tenancy

### 5. Real-Time Progress Reporting

**Progress Interface**:
```typescript
interface SyncProgress {
  stage: 'orders' | 'products' | 'customers' | 'complete'
  processed: number
  total: number
  errors: string[]
}
```

**User Experience**:
- Real-time progress updates in dashboard
- Error reporting without stopping sync
- Graceful handling of partial failures

### 6. Incremental Updates via Webhooks

**Webhook System** (`src/lib/shopify/webhooks.ts`):

**Supported Events**:
- `orders/create`, `orders/updated`, `orders/cancelled`
- `customers/create`, `customers/updated`
- `products/create`, `products/updated`
- `app/uninstalled`

**Webhook Processing**:
```typescript
// Real-time updates without full re-sync
static async syncSingleOrder(shop: string, orderId: number) {
  const api = new ShopifyAPI(session.shop, session.accessToken)
  const { order } = await api.getOrder(orderId)
  await this.insertOrders([order], shopId)
}
```

### 7. Multi-Tenant Data Architecture

**Database Schema** (`shopify_database_schema.sql`):

**Key Tables**:
- `shops` - Store information and settings
- `orders`, `customers`, `products` - All have `shop_id` column
- `webhook_events` - Event tracking and deduplication
- `sync_logs` - Sync history and debugging

**Row Level Security (RLS)**:
```sql
-- Example policy
CREATE POLICY "Users can only see their shop's orders" ON orders
  FOR ALL USING (shop_id = current_setting('app.current_shop_id'));
```

### 8. Error Handling & Recovery

**Resilience Features**:
- **Retry Logic**: Exponential backoff on failures
- **Partial Sync Recovery**: Resume from last successful batch
- **Error Logging**: Detailed logs for debugging
- **Graceful Degradation**: App works with partial data

**Error Types Handled**:
- Network timeouts
- Rate limit exceeded
- Invalid tokens (re-authentication)
- Malformed data
- Database constraints

### 9. Performance Optimizations

**Caching Strategy**:
- **In-Memory Cache**: 5-minute TTL for settings/KPIs
- **Shop-Specific Caching**: Isolated per merchant
- **Materialized Views**: Pre-computed analytics

**Query Optimization**:
- **Indexed Columns**: `shop_id`, `created_at`, `customer_id`
- **Batch Operations**: Minimize database round trips
- **Connection Pooling**: Efficient database connections

### 10. Monitoring & Observability

**Metrics Tracked**:
- Sync completion times
- API request counts and errors
- Database query performance
- User engagement post-sync

**Logging Strategy**:
```typescript
console.log('🔄 Starting customer sync...')
console.log(`📊 Processing ${orders.length} orders`)
console.log('✅ Sync complete')
console.error('❌ Sync failed:', error)
```

## API Limit Considerations

### Shopify API Limits

**Standard Limits**:
- **REST API**: 40 requests/second (burst), 2 requests/second (sustained)
- **GraphQL**: 1000 points/second (varies by query complexity)
- **Webhook**: 20,000 requests/minute

**Our Approach**:
- Stay well below limits with 40 requests/second max
- Use REST API for simplicity and reliability
- Implement request queuing for high-volume operations

### Scaling Considerations

**For Large Stores**:
- **100k+ orders**: ~7 minutes initial sync
- **1M+ orders**: Background processing with progress updates
- **Multiple stores**: Parallel processing with global rate limiting

**Future Enhancements**:
- GraphQL migration for complex queries
- Background job queues (Redis/Bull)
- Incremental sync scheduling
- Data archiving for historical records

## Shop-Aware Data Fetching

### Context Integration

**Shop Context** (`src/contexts/ShopContext.tsx`):
```typescript
const { shop, session, isAuthenticated } = useShop()
const shopId = session?.shopId || shop
```

**Data Fetcher Updates**:
```typescript
// All queries now include shop_id filtering
const kpiData = await getKPIsOptimized(filters, shopId, options)
```

### Multi-Tenancy Benefits

1. **Data Isolation**: Each shop sees only their data
2. **Performance**: Queries are automatically scoped
3. **Security**: RLS prevents data leakage
4. **Scalability**: Horizontal scaling by shop

This architecture ensures that echoSignal can handle stores of any size while providing real-time insights and maintaining excellent performance.