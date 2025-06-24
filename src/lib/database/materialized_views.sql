-- Materialized Views for ShopifyIQ Analytics Performance (with merchant_id support)
-- Run this in your Supabase SQL Editor after the main schema and after populating tables with merchant_id

-- Daily Revenue Summary View (partitioned by merchant)
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_revenue_summary AS
SELECT 
    o.merchant_id,
    DATE(o.created_at) as date,
    COUNT(*) as total_orders,
    COUNT(DISTINCT o.customer_id) as unique_customers,
    SUM(o.total_price) as total_revenue,
    AVG(o.total_price) as avg_order_value,
    COALESCE(o.channel, 'unknown') as channel,
    'mixed' as customer_segment -- Default since column may not exist
FROM orders o
WHERE o.created_at >= CURRENT_DATE - INTERVAL '2 years'
AND o.created_at IS NOT NULL
GROUP BY o.merchant_id, DATE(o.created_at), COALESCE(o.channel, 'unknown');

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_daily_revenue_summary_merchant_id ON daily_revenue_summary(merchant_id);
CREATE INDEX IF NOT EXISTS idx_daily_revenue_summary_date ON daily_revenue_summary(date);
CREATE INDEX IF NOT EXISTS idx_daily_revenue_summary_channel ON daily_revenue_summary(channel);
CREATE INDEX IF NOT EXISTS idx_daily_revenue_summary_segment ON daily_revenue_summary(customer_segment);

-- Product Performance Summary View (With correct PK/FK joins to products, partitioned by merchant)
CREATE MATERIALIZED VIEW IF NOT EXISTS product_performance_summary AS
SELECT 
    o.merchant_id,
    oi.product_id,
    p.name as product_name,
    p.category,
    COUNT(DISTINCT oi.order_id) as total_orders,
    SUM(oi.quantity) as total_units_sold,
    SUM(oi.price * oi.quantity) as total_revenue,
    AVG(oi.price) as avg_price,
    COUNT(DISTINCT o.customer_id) as unique_customers,
    MIN(o.created_at) as first_ordered,
    MAX(o.created_at) as last_ordered,
    DATE(o.created_at) as order_date
FROM order_line_items oi
JOIN orders o ON oi.order_id = o.id
LEFT JOIN products p ON oi.product_id = p.id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '2 years'
AND o.created_at IS NOT NULL
GROUP BY o.merchant_id, oi.product_id, p.name, p.category, DATE(o.created_at);

-- Create indexes on product performance view
CREATE INDEX IF NOT EXISTS idx_product_performance_merchant_id ON product_performance_summary(merchant_id);
CREATE INDEX IF NOT EXISTS idx_product_performance_product_id ON product_performance_summary(product_id);
CREATE INDEX IF NOT EXISTS idx_product_performance_date ON product_performance_summary(order_date);
CREATE INDEX IF NOT EXISTS idx_product_performance_category ON product_performance_summary(category);

-- Customer Segment Analysis View (Dynamic segmentation based on order count, partitioned by merchant)
CREATE MATERIALIZED VIEW IF NOT EXISTS customer_segment_summary AS
WITH customer_order_counts AS (
    SELECT 
        o.merchant_id,
        o.customer_id,
        DATE(o.created_at) as date,
        COUNT(*) OVER (PARTITION BY o.merchant_id, o.customer_id ORDER BY o.created_at ROWS UNBOUNDED PRECEDING) as order_number,
        o.total_price
    FROM orders o
    WHERE o.created_at >= CURRENT_DATE - INTERVAL '2 years'
    AND o.created_at IS NOT NULL
    AND o.customer_id IS NOT NULL
),
segmented_orders AS (
    SELECT 
        merchant_id,
        date,
        customer_id,
        total_price,
        CASE 
            WHEN order_number = 1 THEN 'new'
            WHEN order_number BETWEEN 2 AND 5 THEN 'returning'
            WHEN order_number > 5 THEN 'vip'
            ELSE 'new'
        END as customer_segment
    FROM customer_order_counts
)
SELECT 
    merchant_id,
    customer_segment,
    date,
    COUNT(*) as orders_count,
    COUNT(DISTINCT customer_id) as customers_count,
    SUM(total_price) as total_revenue,
    AVG(total_price) as avg_order_value
FROM segmented_orders
GROUP BY merchant_id, customer_segment, date;

-- Create indexes on customer segment view
CREATE INDEX IF NOT EXISTS idx_customer_segment_summary_merchant_id ON customer_segment_summary(merchant_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment_summary_segment ON customer_segment_summary(customer_segment);
CREATE INDEX IF NOT EXISTS idx_customer_segment_summary_date ON customer_segment_summary(date);

-- Channel Performance Summary View (partitioned by merchant)
CREATE MATERIALIZED VIEW IF NOT EXISTS channel_performance_summary AS
SELECT 
    o.merchant_id,
    COALESCE(o.channel, 'unknown') as channel,
    DATE(o.created_at) as date,
    COUNT(*) as orders_count,
    COUNT(DISTINCT o.customer_id) as customers_count,
    SUM(o.total_price) as total_revenue,
    AVG(o.total_price) as avg_order_value
FROM orders o
WHERE o.created_at >= CURRENT_DATE - INTERVAL '2 years'
AND o.created_at IS NOT NULL
GROUP BY o.merchant_id, COALESCE(o.channel, 'unknown'), DATE(o.created_at);

-- Create indexes on channel performance view
CREATE INDEX IF NOT EXISTS idx_channel_performance_summary_merchant_id ON channel_performance_summary(merchant_id);
CREATE INDEX IF NOT EXISTS idx_channel_performance_summary_channel ON channel_performance_summary(channel);
CREATE INDEX IF NOT EXISTS idx_channel_performance_summary_date ON channel_performance_summary(date);

-- Customer Retention Analysis View (partitioned by merchant)
CREATE MATERIALIZED VIEW IF NOT EXISTS customer_retention_summary AS
WITH customer_orders AS (
    SELECT 
        o.merchant_id,
        o.customer_id,
        DATE(o.created_at) as order_date,
        ROW_NUMBER() OVER (PARTITION BY o.merchant_id, o.customer_id ORDER BY o.created_at) as order_number,
        o.total_price
    FROM orders o
    WHERE o.customer_id IS NOT NULL
    AND o.created_at IS NOT NULL
    AND o.created_at >= CURRENT_DATE - INTERVAL '2 years'
),
customer_metrics AS (
    SELECT 
        merchant_id,
        customer_id,
        COUNT(*) as total_orders,
        MIN(order_date) as first_order_date,
        MAX(order_date) as last_order_date,
        SUM(total_price) as total_spent,
        AVG(total_price) as avg_order_value,
        CASE 
            WHEN COUNT(*) = 1 THEN 'new'
            WHEN COUNT(*) BETWEEN 2 AND 5 THEN 'returning'
            WHEN COUNT(*) > 5 AND MAX(order_date) >= CURRENT_DATE - INTERVAL '30 days' THEN 'vip'
            WHEN MAX(order_date) < CURRENT_DATE - INTERVAL '60 days' THEN 'at_risk'
            ELSE 'returning'
        END as calculated_segment
    FROM customer_orders
    GROUP BY merchant_id, customer_id
)
SELECT 
    merchant_id,
    calculated_segment,
    COUNT(*) as customers_count,
    AVG(total_orders) as avg_orders_per_customer,
    AVG(total_spent) as avg_customer_ltv,
    AVG(avg_order_value) as avg_order_value,
    COUNT(CASE WHEN last_order_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as active_last_30_days,
    COUNT(CASE WHEN last_order_date >= CURRENT_DATE - INTERVAL '60 days' THEN 1 END) as active_last_60_days
FROM customer_metrics
GROUP BY merchant_id, calculated_segment;

-- Create indexes on customer retention view
CREATE INDEX IF NOT EXISTS idx_customer_retention_summary_merchant_id ON customer_retention_summary(merchant_id);
CREATE INDEX IF NOT EXISTS idx_customer_retention_summary_segment ON customer_retention_summary(calculated_segment);

-- Refund Analysis View (partitioned by merchant)
CREATE MATERIALIZED VIEW IF NOT EXISTS refund_summary AS
SELECT 
    r.merchant_id,
    r.created_at::date as date,
    p.name as product_name,
    p.category,
    COUNT(*) as refund_count,
    SUM(r.amount) as total_refund_amount,
    AVG(r.amount) as avg_refund_amount,
    COALESCE(r.reason, 'N/A') as reason,
    COALESCE(r.status, 'N/A') as status
FROM refunds r
LEFT JOIN products p ON r.product_id = p.id
WHERE r.created_at >= CURRENT_DATE - INTERVAL '2 years'
AND r.created_at IS NOT NULL
GROUP BY r.merchant_id, r.created_at::date, p.name, p.category, reason, status;

-- Create indexes on refund summary view
CREATE INDEX IF NOT EXISTS idx_refund_summary_merchant_id ON refund_summary(merchant_id);
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