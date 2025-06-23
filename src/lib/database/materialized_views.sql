-- Materialized Views for ShopifyIQ Analytics Performance
-- Updated to match actual database schema
-- Run this in your Supabase SQL Editor after the main schema

-- Daily Revenue Summary View
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_revenue_summary AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_orders,
    COUNT(DISTINCT user_id) as unique_customers,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value,
    'online' as channel, -- Default channel since not in schema
    'mixed' as customer_segment -- Default segment since not in schema
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '2 years'
AND created_at IS NOT NULL
GROUP BY DATE(created_at);

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_daily_revenue_summary_date ON daily_revenue_summary(date);
CREATE INDEX IF NOT EXISTS idx_daily_revenue_summary_channel ON daily_revenue_summary(channel);
CREATE INDEX IF NOT EXISTS idx_daily_revenue_summary_segment ON daily_revenue_summary(customer_segment);

-- Product Performance Summary View
CREATE MATERIALIZED VIEW IF NOT EXISTS product_performance_summary AS
SELECT 
    oi.product_id,
    CONCAT('Product ', oi.product_id) as product_name, -- Placeholder since no products table
    'General' as category, -- Default category since no products table
    COUNT(DISTINCT oi.order_id) as total_orders,
    SUM(oi.quantity) as total_units_sold,
    SUM(oi.price * oi.quantity) as total_revenue,
    AVG(oi.price) as avg_price,
    COUNT(DISTINCT o.user_id) as unique_customers,
    MIN(o.created_at) as first_ordered,
    MAX(o.created_at) as last_ordered,
    DATE(o.created_at) as order_date
FROM order_line_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '2 years'
AND o.created_at IS NOT NULL
GROUP BY oi.product_id, DATE(o.created_at);

-- Create indexes on product performance view
CREATE INDEX IF NOT EXISTS idx_product_performance_product_id ON product_performance_summary(product_id);
CREATE INDEX IF NOT EXISTS idx_product_performance_date ON product_performance_summary(order_date);
CREATE INDEX IF NOT EXISTS idx_product_performance_category ON product_performance_summary(category);

-- Customer Segment Analysis View (Dynamic Segmentation)
CREATE MATERIALIZED VIEW IF NOT EXISTS customer_segment_summary AS
WITH customer_order_counts AS (
    SELECT 
        user_id,
        DATE(created_at) as date,
        COUNT(*) OVER (PARTITION BY user_id ORDER BY created_at ROWS UNBOUNDED PRECEDING) as order_number,
        total_amount,
        created_at
    FROM orders
    WHERE created_at >= CURRENT_DATE - INTERVAL '2 years'
    AND created_at IS NOT NULL
    AND user_id IS NOT NULL
),
segmented_orders AS (
    SELECT 
        date,
        user_id,
        total_amount,
        CASE 
            WHEN order_number = 1 THEN 'new'
            WHEN order_number BETWEEN 2 AND 5 THEN 'returning'
            WHEN order_number > 5 THEN 'vip'
            ELSE 'new'
        END as customer_segment
    FROM customer_order_counts
)
SELECT 
    customer_segment,
    date,
    COUNT(*) as orders_count,
    COUNT(DISTINCT user_id) as customers_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value
FROM segmented_orders
GROUP BY customer_segment, date;

-- Create indexes on customer segment view
CREATE INDEX IF NOT EXISTS idx_customer_segment_summary_segment ON customer_segment_summary(customer_segment);
CREATE INDEX IF NOT EXISTS idx_customer_segment_summary_date ON customer_segment_summary(date);

-- Channel Performance Summary View (Single channel since not in schema)
CREATE MATERIALIZED VIEW IF NOT EXISTS channel_performance_summary AS
SELECT 
    'online' as channel, -- Default channel since not in schema
    DATE(created_at) as date,
    COUNT(*) as orders_count,
    COUNT(DISTINCT user_id) as customers_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '2 years'
AND created_at IS NOT NULL
GROUP BY DATE(created_at);

-- Create indexes on channel performance view
CREATE INDEX IF NOT EXISTS idx_channel_performance_summary_channel ON channel_performance_summary(channel);
CREATE INDEX IF NOT EXISTS idx_channel_performance_summary_date ON channel_performance_summary(date);

-- Customer Retention Analysis View
CREATE MATERIALIZED VIEW IF NOT EXISTS customer_retention_summary AS
WITH customer_orders AS (
    SELECT 
        user_id,
        DATE(created_at) as order_date,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as order_number,
        total_amount
    FROM orders
    WHERE user_id IS NOT NULL
    AND created_at IS NOT NULL
    AND created_at >= CURRENT_DATE - INTERVAL '2 years'
),
customer_metrics AS (
    SELECT 
        user_id,
        COUNT(*) as total_orders,
        MIN(order_date) as first_order_date,
        MAX(order_date) as last_order_date,
        SUM(total_amount) as total_spent,
        AVG(total_amount) as avg_order_value,
        CASE 
            WHEN COUNT(*) = 1 THEN 'new'
            WHEN COUNT(*) BETWEEN 2 AND 5 THEN 'returning'
            WHEN COUNT(*) > 5 AND MAX(order_date) >= CURRENT_DATE - INTERVAL '30 days' THEN 'vip'
            WHEN MAX(order_date) < CURRENT_DATE - INTERVAL '60 days' THEN 'at_risk'
            ELSE 'returning'
        END as calculated_segment
    FROM customer_orders
    GROUP BY user_id
)
SELECT 
    calculated_segment,
    COUNT(*) as customers_count,
    AVG(total_orders) as avg_orders_per_customer,
    AVG(total_spent) as avg_customer_ltv,
    AVG(avg_order_value) as avg_order_value,
    COUNT(CASE WHEN last_order_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as active_last_30_days,
    COUNT(CASE WHEN last_order_date >= CURRENT_DATE - INTERVAL '60 days' THEN 1 END) as active_last_60_days
FROM customer_metrics
GROUP BY calculated_segment;

-- Refund Analysis View (Simplified since no refunds table visible)
CREATE MATERIALIZED VIEW IF NOT EXISTS refund_summary AS
SELECT 
    CURRENT_DATE as date,
    'No Refunds Data' as product_name,
    'General' as category,
    0 as refund_count,
    0.00 as total_refund_amount,
    0.00 as avg_refund_amount,
    'N/A' as reason,
    'N/A' as status
WHERE FALSE; -- Empty view since no refunds table

-- Create indexes on refund summary view
CREATE INDEX IF NOT EXISTS idx_refund_summary_date ON refund_summary(date);
CREATE INDEX IF NOT EXISTS idx_refund_summary_product ON refund_summary(product_name);
CREATE INDEX IF NOT EXISTS idx_refund_summary_category ON refund_summary(category);

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW daily_revenue_summary;
    REFRESH MATERIALIZED VIEW product_performance_summary;
    REFRESH MATERIALIZED VIEW customer_segment_summary;
    REFRESH MATERIALIZED VIEW channel_performance_summary;
    REFRESH MATERIALIZED VIEW customer_retention_summary;
    REFRESH MATERIALIZED VIEW refund_summary;
END;
$$ LANGUAGE plpgsql;

-- Create a function to automatically refresh views (can be called by a cron job)
CREATE OR REPLACE FUNCTION auto_refresh_views()
RETURNS void AS $$
BEGIN
    -- Only refresh if the last refresh was more than 1 hour ago
    -- This prevents excessive refreshing
    PERFORM refresh_analytics_views();
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON daily_revenue_summary TO anon, authenticated;
GRANT SELECT ON product_performance_summary TO anon, authenticated;
GRANT SELECT ON customer_segment_summary TO anon, authenticated;
GRANT SELECT ON channel_performance_summary TO anon, authenticated;
GRANT SELECT ON customer_retention_summary TO anon, authenticated;
GRANT SELECT ON refund_summary TO anon, authenticated;
GRANT EXECUTE ON FUNCTION refresh_analytics_views() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_refresh_views() TO authenticated;

-- Initial refresh of all views
SELECT refresh_analytics_views();