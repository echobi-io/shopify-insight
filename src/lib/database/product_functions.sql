-- Remove Product Performance RPC Functions
-- These functions have been replaced with direct table queries in the application code

-- Drop existing functions to prevent timeout issues
DROP FUNCTION IF EXISTS get_product_performance(UUID, TIMESTAMP, TIMESTAMP);
DROP FUNCTION IF EXISTS get_product_trend(UUID, UUID[], TIMESTAMP, TIMESTAMP);

-- Note: Product performance data is now fetched directly from tables using:
-- - products table for basic product information
-- - order_items table joined with orders for sales data
-- - Direct calculations in getProductPerformanceData.ts

-- Essential indexes for performance (keep these)
CREATE INDEX IF NOT EXISTS idx_orders_merchant_created ON orders(merchant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_merchant_active ON products(merchant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_order_items_merchant ON order_items(merchant_id);

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_merchant ON orders(customer_id, merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel);