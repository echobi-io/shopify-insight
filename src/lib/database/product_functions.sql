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
    p.title as name,
    COALESCE(p.handle, p.id::text) as sku,
    p.product_type as category,
    COALESCE(SUM(li.price * li.quantity), 0) as total_revenue,
    COALESCE(SUM(li.quantity), 0) as units_sold,
    CASE 
      WHEN SUM(li.quantity) > 0 
      THEN SUM(li.price * li.quantity) / SUM(li.quantity)
      ELSE 0 
    END as avg_price,
    -- Simple profit margin calculation (assuming 30% base margin)
    30.0 as profit_margin,
    -- Performance score based on revenue and units (0-100 scale)
    CASE 
      WHEN SUM(li.price * li.quantity) > 0 
      THEN LEAST(100, (SUM(li.price * li.quantity) / 1000.0) * 20 + (SUM(li.quantity) / 10.0) * 10)
      ELSE 0 
    END as performance_score
  FROM "Product" p
  LEFT JOIN "LineItem" li ON p.id = li.product_id
  LEFT JOIN "Order" o ON li.order_id = o.id
  WHERE o.merchant_id = get_product_performance.merchant_id
    AND o.created_at >= get_product_performance.start_date
    AND o.created_at <= get_product_performance.end_date
    AND o.financial_status = 'paid'
  GROUP BY p.id, p.title, p.handle, p.product_type
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
    SUM(li.price * li.quantity) as revenue,
    SUM(li.quantity) as units
  FROM "Order" o
  JOIN "LineItem" li ON o.id = li.order_id
  WHERE o.merchant_id = get_product_trend.merchant_id
    AND li.product_id = ANY(get_product_trend.product_ids)
    AND o.created_at >= get_product_trend.start_date
    AND o.created_at <= get_product_trend.end_date
    AND o.financial_status = 'paid'
  GROUP BY DATE(o.created_at)
  ORDER BY date;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_product_performance(UUID, TIMESTAMP, TIMESTAMP) TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_trend(UUID, UUID[], TIMESTAMP, TIMESTAMP) TO authenticated;

-- Optional: Create indexes for better performance if they don't exist
-- CREATE INDEX IF NOT EXISTS idx_order_merchant_created ON "Order"(merchant_id, created_at);
-- CREATE INDEX IF NOT EXISTS idx_order_financial_status ON "Order"(financial_status);
-- CREATE INDEX IF NOT EXISTS idx_lineitem_product ON "LineItem"(product_id);
-- CREATE INDEX IF NOT EXISTS idx_lineitem_order ON "LineItem"(order_id);
-- CREATE INDEX IF NOT EXISTS idx_product_merchant ON "Product"(merchant_id);