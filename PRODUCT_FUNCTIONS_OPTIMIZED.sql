-- Optimized Product Performance Functions for Supabase
-- Simplified to prevent timeouts and improve performance

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_product_performance(UUID, TIMESTAMP, TIMESTAMP);
DROP FUNCTION IF EXISTS get_product_trend(UUID, UUID[], TIMESTAMP, TIMESTAMP);

-- Simplified function to get product performance data
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
  -- First, try to get products with sales data
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    COALESCE(p.shopify_product_id, p.id::text) as sku,
    p.category,
    COALESCE(product_sales.total_revenue, 0) as total_revenue,
    COALESCE(product_sales.units_sold, 0) as units_sold,
    COALESCE(product_sales.avg_price, 0) as avg_price,
    COALESCE(p.price * 0.3, 30.0) as profit_margin, -- Simplified profit margin
    CASE 
      WHEN product_sales.total_revenue > 0 
      THEN LEAST(100, product_sales.total_revenue / 100.0)
      ELSE 0 
    END as performance_score
  FROM products p
  LEFT JOIN (
    SELECT 
      oi.product_id,
      SUM(oi.price * oi.quantity) as total_revenue,
      SUM(oi.quantity) as units_sold,
      AVG(oi.price) as avg_price
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.merchant_id = get_product_performance.merchant_id
      AND o.created_at >= get_product_performance.start_date
      AND o.created_at <= get_product_performance.end_date
    GROUP BY oi.product_id
  ) product_sales ON p.id = product_sales.product_id
  WHERE p.merchant_id = get_product_performance.merchant_id
    AND p.is_active = true
  ORDER BY COALESCE(product_sales.total_revenue, 0) DESC
  LIMIT 50;
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