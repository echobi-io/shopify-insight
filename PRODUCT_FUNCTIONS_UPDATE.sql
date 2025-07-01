-- IMPORTANT: Execute this SQL in your Supabase SQL Editor to fix the product performance issues
-- This will replace the existing RPC functions with corrected table names

-- Drop existing functions first (if they exist)
DROP FUNCTION IF EXISTS get_product_performance(UUID, TIMESTAMP, TIMESTAMP);
DROP FUNCTION IF EXISTS get_product_trend(UUID, UUID[], TIMESTAMP, TIMESTAMP);

-- Product Performance Functions for Supabase
-- These functions provide product analytics data for the EchoIQ dashboard

-- Function to get product performance data
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
    COALESCE(p.sku, p.id::text) as sku,
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
    AND o.status IN ('confirmed', 'shipped', 'delivered')
    AND p.active = true
  GROUP BY p.id, p.name, p.sku, p.category, p.cost, p.price
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
    AND o.status IN ('confirmed', 'shipped', 'delivered')
  GROUP BY DATE(o.created_at)
  ORDER BY date;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_product_performance(UUID, TIMESTAMP, TIMESTAMP) TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_trend(UUID, UUID[], TIMESTAMP, TIMESTAMP) TO authenticated;

-- Optional: Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_orders_merchant_created ON orders(merchant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_merchant ON products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

-- Verify the functions were created successfully
SELECT 
  routine_name, 
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name IN ('get_product_performance', 'get_product_trend')
  AND routine_schema = 'public';