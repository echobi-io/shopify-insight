-- CORRECTED FIX: Execute this SQL in your Supabase SQL Editor
-- This creates basic product performance functions with correct table names and no invalid column references

-- Drop any existing functions first
DROP FUNCTION IF EXISTS get_product_performance(UUID, TIMESTAMP, TIMESTAMP);
DROP FUNCTION IF EXISTS get_product_trend(UUID, UUID[], TIMESTAMP, TIMESTAMP);

-- Create a simple product performance function
-- Updated to use proportional order revenue allocation to match sales analysis calculations
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
  WITH product_order_data AS (
    SELECT 
      p.id,
      p.name,
      p.category,
      p.price,
      oi.quantity,
      oi.price as item_price,
      o.total_price as order_total,
      -- Calculate this product's proportion of the order's line items total
      (oi.price * oi.quantity) / NULLIF(
        (SELECT SUM(oi2.price * oi2.quantity) 
         FROM order_items oi2 
         WHERE oi2.order_id = o.id), 0
      ) as product_proportion
    FROM products p
    LEFT JOIN order_items oi ON p.id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.id
    WHERE p.merchant_id = get_product_performance.merchant_id
      AND (o.created_at IS NULL OR (o.created_at >= get_product_performance.start_date AND o.created_at <= get_product_performance.end_date))
      AND (p.is_active IS NULL OR p.is_active = true)
  )
  SELECT 
    pod.id,
    COALESCE(pod.name, 'Unknown Product') as name,
    COALESCE(pod.id::text, '') as sku,
    pod.category,
    -- Use proportional allocation of order total (includes shipping, tax, etc.)
    COALESCE(SUM(pod.order_total * pod.product_proportion), 0) as total_revenue,
    COALESCE(SUM(pod.quantity), 0) as units_sold,
    CASE 
      WHEN SUM(pod.quantity) > 0 
      THEN SUM(pod.order_total * pod.product_proportion) / SUM(pod.quantity)
      ELSE COALESCE(pod.price, 0)
    END as avg_price,
    0.0 as profit_margin,
    CASE 
      WHEN SUM(pod.order_total * pod.product_proportion) > 0 
      THEN LEAST(100, (SUM(pod.order_total * pod.product_proportion) / 1000.0) * 20 + (SUM(pod.quantity) / 10.0) * 10)
      ELSE 0 
    END as performance_score
  FROM product_order_data pod
  GROUP BY pod.id, pod.name, pod.category, pod.price
  ORDER BY total_revenue DESC;
END;
$$;

-- Create a simple product trend function
-- Updated to use proportional order revenue allocation to match sales analysis calculations
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
  WITH daily_product_data AS (
    SELECT 
      DATE(o.created_at) as date,
      oi.quantity,
      o.total_price as order_total,
      -- Calculate this product's proportion of the order's line items total
      (oi.price * oi.quantity) / NULLIF(
        (SELECT SUM(oi2.price * oi2.quantity) 
         FROM order_items oi2 
         WHERE oi2.order_id = o.id), 0
      ) as product_proportion
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.merchant_id = get_product_trend.merchant_id
      AND oi.product_id = ANY(get_product_trend.product_ids)
      AND o.created_at >= get_product_trend.start_date
      AND o.created_at <= get_product_trend.end_date
  )
  SELECT 
    dpd.date,
    -- Use proportional allocation of order total (includes shipping, tax, etc.)
    SUM(dpd.order_total * dpd.product_proportion) as revenue,
    SUM(dpd.quantity) as units
  FROM daily_product_data dpd
  GROUP BY dpd.date
  ORDER BY dpd.date;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_product_performance(UUID, TIMESTAMP, TIMESTAMP) TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_trend(UUID, UUID[], TIMESTAMP, TIMESTAMP) TO authenticated;

-- Verify functions were created
SELECT 
  routine_name, 
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name IN ('get_product_performance', 'get_product_trend')
  AND routine_schema = 'public';