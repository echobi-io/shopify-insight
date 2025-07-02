-- Function to get top customers by total spent within a date range
CREATE OR REPLACE FUNCTION get_top_customers(
  start_date DATE,
  end_date DATE,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  customer_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  total_spent NUMERIC,
  order_count BIGINT,
  avg_order_value NUMERIC,
  last_order_date TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id::TEXT as customer_id,
    COALESCE(c.first_name || ' ' || c.last_name, 'Unknown Customer') as customer_name,
    COALESCE(c.email, 'No email') as customer_email,
    COALESCE(SUM(o.total_price), 0) as total_spent,
    COUNT(o.id) as order_count,
    CASE 
      WHEN COUNT(o.id) > 0 THEN COALESCE(SUM(o.total_price), 0) / COUNT(o.id)
      ELSE 0
    END as avg_order_value,
    MAX(o.created_at) as last_order_date
  FROM customers c
  INNER JOIN orders o ON c.id = o.customer_id
  WHERE o.created_at >= start_date 
    AND o.created_at <= end_date
  GROUP BY c.id, c.first_name, c.last_name, c.email
  HAVING COUNT(o.id) > 0
  ORDER BY total_spent DESC
  LIMIT limit_count;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_top_customers(DATE, DATE, INTEGER) TO authenticated;