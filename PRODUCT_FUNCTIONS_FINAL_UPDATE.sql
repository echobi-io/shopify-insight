-- COMPREHENSIVE FIX: Execute this SQL in your Supabase SQL Editor
-- This addresses all column name mismatches for product performance functions

-- Drop existing functions first (if they exist)
DROP FUNCTION IF EXISTS get_product_performance(UUID, TIMESTAMP, TIMESTAMP);
DROP FUNCTION IF EXISTS get_product_trend(UUID, UUID[], TIMESTAMP, TIMESTAMP);

-- First, let's check what columns actually exist in your tables
-- Run this query first to see the actual column names:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' AND table_schema = 'public';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders' AND table_schema = 'public';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'order_items' AND table_schema = 'public';

-- Product Performance Functions for Supabase
-- These functions provide product analytics data for the EchoIQ dashboard

-- Function to get product performance data
-- This version handles multiple possible column name variations
CREATE OR REPLACE FUNCTION get_product_performance(
  merchant_id UUID,
  start_date TIMESTAMP,
  end_date TIMESTAMP
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  sku TEXT,
  category TEXT,
  total_revenue NUMERIC,
  units_sold BIGINT,
  avg_price NUMERIC,
  profit_margin NUMERIC,
  performance_score NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    -- Handle different possible SKU column names
    COALESCE(
      CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'shopify_product_id') 
        THEN p.shopify_product_id
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sku') 
        THEN p.sku
        ELSE p.id::text
      END,
      p.id::text
    ) as sku,
    p.category,
    COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue,
    COALESCE(SUM(oi.quantity), 0) as units_sold,
    CASE 
      WHEN SUM(oi.quantity) > 0 
      THEN SUM(oi.price * oi.quantity) / SUM(oi.quantity)
      ELSE 0 
    END as avg_price,
    -- Calculate profit margin based on cost if available, otherwise use 30%
    CASE 
      WHEN p.cost IS NOT NULL AND p.cost > 0 AND p.price > 0
      THEN ((p.price - p.cost) / p.price) * 100
      ELSE 30.0 
    END as profit_margin,
    -- Performance score based on revenue and units (0-100 scale)
    CASE 
      WHEN SUM(oi.price * oi.quantity) > 0 
      THEN LEAST(100, (SUM(oi.price * oi.quantity) / 1000.0) * 20 + (SUM(oi.quantity) / 10.0) * 10)
      ELSE 0 
    END as performance_score
  FROM products p
  LEFT JOIN order_items oi ON p.id = oi.product_id
  LEFT JOIN orders o ON oi.order_id = o.id
  WHERE o.merchant_id = get_product_performance.merchant_id
    AND o.created_at >= get_product_performance.start_date
    AND o.created_at <= get_product_performance.end_date
    -- Handle different possible status column scenarios
    AND (
      (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') 
       AND o.status IN ('confirmed', 'shipped', 'delivered'))
      OR 
      (NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status'))
    )
    AND p.active = true
    AND p.merchant_id = get_product_performance.merchant_id
  GROUP BY p.id, p.name, p.category, p.cost, p.price,
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'shopify_product_id') 
      THEN p.shopify_product_id
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sku') 
      THEN p.sku
      ELSE p.id::text
    END
  ORDER BY total_revenue DESC;
END;
$$;

-- Simplified version that works with basic schema
CREATE OR REPLACE FUNCTION get_product_performance_simple(
  merchant_id UUID,
  start_date TIMESTAMP,
  end_date TIMESTAMP
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  sku TEXT,
  category TEXT,
  total_revenue NUMERIC,
  units_sold BIGINT,
  avg_price NUMERIC,
  profit_margin NUMERIC,
  performance_score NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.id::text as sku, -- Use ID as SKU fallback
    p.category,
    COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue,
    COALESCE(SUM(oi.quantity), 0) as units_sold,
    CASE 
      WHEN SUM(oi.quantity) > 0 
      THEN SUM(oi.price * oi.quantity) / SUM(oi.quantity)
      ELSE 0 
    END as avg_price,
    -- Calculate profit margin based on cost if available, otherwise use 30%
    CASE 
      WHEN p.cost IS NOT NULL AND p.cost > 0 AND p.price > 0
      THEN ((p.price - p.cost) / p.price) * 100
      ELSE 30.0 
    END as profit_margin,
    -- Performance score based on revenue and units (0-100 scale)
    CASE 
      WHEN SUM(oi.price * oi.quantity) > 0 
      THEN LEAST(100, (SUM(oi.price * oi.quantity) / 1000.0) * 20 + (SUM(oi.quantity) / 10.0) * 10)
      ELSE 0 
    END as performance_score
  FROM products p
  LEFT JOIN order_items oi ON p.id = oi.product_id
  LEFT JOIN orders o ON oi.order_id = o.id
  WHERE o.merchant_id = get_product_performance_simple.merchant_id
    AND o.created_at >= get_product_performance_simple.start_date
    AND o.created_at <= get_product_performance_simple.end_date
    AND p.active = true
    AND p.merchant_id = get_product_performance_simple.merchant_id
  GROUP BY p.id, p.name, p.category, p.cost, p.price
  ORDER BY total_revenue DESC;
END;
$$;

-- Function to get product trend data
CREATE OR REPLACE FUNCTION get_product_trend(
  merchant_id UUID,
  product_ids UUID[],
  start_date TIMESTAMP,
  end_date TIMESTAMP
)
RETURNS TABLE (
  date DATE,
  revenue NUMERIC,
  units BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(o.created_at) as date,
    SUM(oi.price * oi.quantity) as revenue,
    SUM(oi.quantity) as units
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  WHERE o.merchant_id = get_product_trend.merchant_id
    AND oi.product_id = ANY(get_product_trend.product_ids)
    AND o.created_at >= get_product_trend.start_date
    AND o.created_at <= get_product_trend.end_date
    -- Handle status column existence
    AND (
      (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') 
       AND o.status IN ('confirmed', 'shipped', 'delivered'))
      OR 
      (NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status'))
    )
  GROUP BY DATE(o.created_at)
  ORDER BY date;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_product_performance(UUID, TIMESTAMP, TIMESTAMP) TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_performance_simple(UUID, TIMESTAMP, TIMESTAMP) TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_trend(UUID, UUID[], TIMESTAMP, TIMESTAMP) TO authenticated;

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_orders_merchant_created ON orders(merchant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_merchant ON products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

-- Add status index only if the column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  END IF;
END $$;

-- Verify the functions were created successfully
SELECT 
  routine_name, 
  routine_type
FROM information_schema.routines 
WHERE routine_name IN ('get_product_performance', 'get_product_performance_simple', 'get_product_trend')
  AND routine_schema = 'public';

-- Show actual table structures for debugging
SELECT 'products' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' AND table_schema = 'public'
UNION ALL
SELECT 'orders' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND table_schema = 'public'
UNION ALL
SELECT 'order_items' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_items' AND table_schema = 'public'
ORDER BY table_name, column_name;