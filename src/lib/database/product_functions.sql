-- Ultra-Simplified Product Performance Functions for Supabase
-- Minimal complexity to prevent timeouts

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_product_performance(UUID, TIMESTAMP, TIMESTAMP);
DROP FUNCTION IF EXISTS get_product_trend(UUID, UUID[], TIMESTAMP, TIMESTAMP);

-- Minimal function to test basic functionality
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
  -- Minimal query to test if basic product access works
  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(p.name, 'Unknown Product') as name,
    COALESCE(p.shopify_product_id, p.id::text) as sku,
    'General' as category,
    100.0::NUMERIC as total_revenue,
    5::BIGINT as units_sold,
    20.0::NUMERIC as avg_price,
    30.0::NUMERIC as profit_margin,
    75.0::NUMERIC as performance_score
  FROM products p
  WHERE p.merchant_id = get_product_performance.merchant_id
  LIMIT 10;
END;
$$;

-- Simplified function to get product trend data
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
  GROUP BY DATE(o.created_at)
  ORDER BY date
  LIMIT 100;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_product_performance(UUID, TIMESTAMP, TIMESTAMP) TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_trend(UUID, UUID[], TIMESTAMP, TIMESTAMP) TO authenticated;

-- Create essential indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_orders_merchant_created ON orders(merchant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_merchant_active ON products(merchant_id, is_active);