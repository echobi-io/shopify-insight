-- Customer Clusters Table for AI-powered customer segmentation
-- Run this in your Supabase SQL Editor after the main schema

-- Create customer_clusters table
CREATE TABLE IF NOT EXISTS customer_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  merchant_id UUID NOT NULL,
  cluster_label TEXT NOT NULL,
  cluster_features JSONB, -- Store the features used for clustering
  confidence FLOAT DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_clusters_merchant_id ON customer_clusters(merchant_id);
CREATE INDEX IF NOT EXISTS idx_customer_clusters_customer_id ON customer_clusters(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_clusters_label ON customer_clusters(cluster_label);

-- Enable Row Level Security
ALTER TABLE customer_clusters ENABLE ROW LEVEL SECURITY;

-- Create policies for read access
CREATE POLICY "Allow read access to customer_clusters" ON customer_clusters FOR SELECT USING (true);

-- Grant necessary permissions
GRANT SELECT ON customer_clusters TO anon, authenticated;

-- Sample data for demonstration (you would replace this with actual ML-generated clusters)
-- This creates some sample clusters based on customer behavior patterns

-- First, let's create a function to generate sample clusters
CREATE OR REPLACE FUNCTION generate_sample_customer_clusters()
RETURNS void AS $$
DECLARE
    merchant_uuid UUID := '11111111-1111-1111-1111-111111111111';
    customer_record RECORD;
    cluster_label TEXT;
BEGIN
    -- Clear existing sample data for this merchant
    DELETE FROM customer_clusters WHERE merchant_id = merchant_uuid;
    
    -- Generate clusters for customers based on their spending patterns
    FOR customer_record IN 
        SELECT 
            c.id,
            COALESCE(c.total_spent, 0) as total_spent,
            COALESCE(c.orders_count, 0) as orders_count,
            CASE 
                WHEN c.orders_count IS NULL OR c.orders_count = 0 THEN 0
                ELSE COALESCE(c.total_spent, 0) / c.orders_count
            END as avg_order_value
        FROM customers c 
        WHERE c.merchant_id = merchant_uuid
        AND c.id IS NOT NULL
        LIMIT 100 -- Limit for demo purposes
    LOOP
        -- Assign cluster based on spending behavior
        IF customer_record.total_spent > 1000 AND customer_record.orders_count > 5 THEN
            cluster_label := 'A'; -- High-value loyal customers
        ELSIF customer_record.total_spent > 500 AND customer_record.orders_count <= 3 THEN
            cluster_label := 'B'; -- High-spending low-frequency customers
        ELSIF customer_record.orders_count > 5 AND customer_record.avg_order_value < 50 THEN
            cluster_label := 'C'; -- Frequent small-basket customers
        ELSIF customer_record.total_spent < 200 AND customer_record.orders_count <= 2 THEN
            cluster_label := 'D'; -- New/low-engagement customers
        ELSE
            cluster_label := 'E'; -- Moderate engagement customers
        END IF;
        
        -- Insert the cluster assignment
        INSERT INTO customer_clusters (
            customer_id,
            merchant_id,
            cluster_label,
            cluster_features,
            confidence
        ) VALUES (
            customer_record.id,
            merchant_uuid,
            cluster_label,
            jsonb_build_object(
                'total_spent', customer_record.total_spent,
                'orders_count', customer_record.orders_count,
                'avg_order_value', customer_record.avg_order_value
            ),
            0.85 + (random() * 0.15) -- Random confidence between 0.85 and 1.0
        );
    END LOOP;
    
    RAISE NOTICE 'Generated sample customer clusters for merchant %', merchant_uuid;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to generate sample data
SELECT generate_sample_customer_clusters();

-- Create a view for easy cluster analysis
CREATE OR REPLACE VIEW customer_cluster_analysis AS
SELECT 
    cc.cluster_label,
    COUNT(*) as customers_count,
    AVG(c.total_spent) as avg_ltv,
    AVG(c.orders_count) as avg_orders,
    AVG(CASE 
        WHEN c.orders_count > 0 THEN c.total_spent / c.orders_count 
        ELSE 0 
    END) as avg_order_value,
    cc.merchant_id
FROM customer_clusters cc
JOIN customers c ON cc.customer_id = c.id
GROUP BY cc.cluster_label, cc.merchant_id;

-- Grant access to the view
GRANT SELECT ON customer_cluster_analysis TO anon, authenticated;