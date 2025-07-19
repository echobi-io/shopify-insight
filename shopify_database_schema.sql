-- Shopify App Database Schema
-- This file contains the database schema updates needed to transform echoSignal into a Shopify app

-- Create shops table for multi-tenancy
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  plan_name VARCHAR(100) DEFAULT 'free',
  is_active BOOLEAN DEFAULT true,
  shop_name VARCHAR(255),
  shop_email VARCHAR(255),
  currency VARCHAR(10),
  timezone VARCHAR(100),
  country_code VARCHAR(10),
  province_code VARCHAR(10),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(50) DEFAULT 'pending' -- pending, syncing, completed, error
);

-- Create webhook events table for tracking
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  topic VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Create index for webhook events
CREATE INDEX IF NOT EXISTS idx_webhook_events_shop_topic ON webhook_events(shop_id, topic);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed, created_at);

-- Update existing tables to include shop_id for multi-tenancy
-- Note: This assumes your existing tables don't already have shop_id

-- Add shop_id to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_created ON orders(shop_id, created_at);

-- Add shop_id to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_shop_created ON customers(shop_id, created_at);

-- Add shop_id to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_shop_created ON products(shop_id, created_at);

-- Update other existing tables that might need shop_id
-- Add to settings table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'settings') THEN
    ALTER TABLE settings ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_settings_shop_id ON settings(shop_id);
  END IF;
END $$;

-- Add to user_settings table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_settings') THEN
    ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_user_settings_shop_id ON user_settings(shop_id);
  END IF;
END $$;

-- Create sync_logs table for tracking data synchronization
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  sync_type VARCHAR(50) NOT NULL, -- full, incremental, webhook
  entity_type VARCHAR(50) NOT NULL, -- orders, customers, products
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'running', -- running, completed, failed
  records_processed INTEGER DEFAULT 0,
  records_total INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_shop_status ON sync_logs(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started ON sync_logs(started_at);

-- Create app_installations table for tracking installations
CREATE TABLE IF NOT EXISTS app_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uninstalled_at TIMESTAMP WITH TIME ZONE,
  installation_source VARCHAR(100), -- app_store, direct, partner
  version VARCHAR(50),
  is_active BOOLEAN DEFAULT true
);

-- Create billing_subscriptions table for subscription management
CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  plan_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, cancelled, expired, trial
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255)
);

-- Create usage_metrics table for tracking app usage
CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  metric_value INTEGER NOT NULL DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_usage_metrics_shop_metric ON usage_metrics(shop_id, metric_name);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_recorded ON usage_metrics(recorded_at);

-- Create app_reviews table for collecting feedback
CREATE TABLE IF NOT EXISTS app_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_public BOOLEAN DEFAULT false
);

-- Create feature_flags table for A/B testing and feature rollouts
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shop_feature_flags table for per-shop feature flags
CREATE TABLE IF NOT EXISTS shop_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  feature_flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, feature_flag_id)
);

-- Update existing functions to be shop-aware
-- This is a template - you'll need to update your specific functions

-- Example: Update get_dashboard_data function to include shop_id parameter
CREATE OR REPLACE FUNCTION get_dashboard_data_shopify(
  p_shop_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_revenue DECIMAL,
  total_orders INTEGER,
  total_customers INTEGER,
  avg_order_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(o.total_price), 0) as total_revenue,
    COUNT(o.id)::INTEGER as total_orders,
    COUNT(DISTINCT o.customer_id)::INTEGER as total_customers,
    COALESCE(AVG(o.total_price), 0) as avg_order_value
  FROM orders o
  WHERE o.shop_id = p_shop_id
    AND o.created_at::DATE BETWEEN p_start_date AND p_end_date
    AND o.financial_status = 'paid';
END;
$$ LANGUAGE plpgsql;

-- Create RLS (Row Level Security) policies for multi-tenancy
-- Enable RLS on tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Create policies (these are examples - adjust based on your auth system)
-- Policy for shops table - shops can only see their own data
CREATE POLICY shop_isolation_policy ON shops
  FOR ALL
  USING (shop_domain = current_setting('app.current_shop', true));

-- Policy for orders table - only show orders for the current shop
CREATE POLICY orders_shop_isolation ON orders
  FOR ALL
  USING (shop_id::text = current_setting('app.current_shop_id', true));

-- Policy for customers table
CREATE POLICY customers_shop_isolation ON customers
  FOR ALL
  USING (shop_id::text = current_setting('app.current_shop_id', true));

-- Policy for products table
CREATE POLICY products_shop_isolation ON products
  FOR ALL
  USING (shop_id::text = current_setting('app.current_shop_id', true));

-- Policy for webhook_events table
CREATE POLICY webhook_events_shop_isolation ON webhook_events
  FOR ALL
  USING (shop_id::text = current_setting('app.current_shop_id', true));

-- Insert some default feature flags
INSERT INTO feature_flags (flag_name, is_enabled, description) VALUES
  ('ai_insights', true, 'Enable AI-powered business insights'),
  ('advanced_analytics', true, 'Enable advanced analytics features'),
  ('cohort_analysis', true, 'Enable cohort analysis'),
  ('churn_prediction', true, 'Enable churn prediction features'),
  ('export_reports', true, 'Enable report export functionality')
ON CONFLICT DO NOTHING;

-- Create a function to set shop context for RLS
CREATE OR REPLACE FUNCTION set_shop_context(shop_domain TEXT, shop_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_shop', shop_domain, true);
  PERFORM set_config('app.current_shop_id', shop_id::text, true);
END;
$$ LANGUAGE plpgsql;

-- Create a function to get shop by domain
CREATE OR REPLACE FUNCTION get_shop_by_domain(domain TEXT)
RETURNS TABLE (
  id UUID,
  shop_domain VARCHAR,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.shop_domain, s.is_active, s.created_at
  FROM shops s
  WHERE s.shop_domain = domain AND s.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shops_domain_active ON shops(shop_domain, is_active);
CREATE INDEX IF NOT EXISTS idx_shops_created_at ON shops(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_logs_shop_type ON sync_logs(shop_id, entity_type);

-- Add constraints
ALTER TABLE shops ADD CONSTRAINT shops_domain_format 
  CHECK (shop_domain ~ '^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$');

-- Create a view for active shops with their latest sync status
CREATE OR REPLACE VIEW active_shops_with_sync AS
SELECT 
  s.id,
  s.shop_domain,
  s.shop_name,
  s.created_at,
  s.last_sync_at,
  s.sync_status,
  COUNT(o.id) as total_orders,
  COUNT(c.id) as total_customers,
  COUNT(p.id) as total_products
FROM shops s
LEFT JOIN orders o ON s.id = o.shop_id
LEFT JOIN customers c ON s.id = c.shop_id  
LEFT JOIN products p ON s.id = p.shop_id
WHERE s.is_active = true
GROUP BY s.id, s.shop_domain, s.shop_name, s.created_at, s.last_sync_at, s.sync_status;

-- Grant necessary permissions (adjust based on your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

COMMENT ON TABLE shops IS 'Stores information about connected Shopify shops';
COMMENT ON TABLE webhook_events IS 'Logs all webhook events received from Shopify';
COMMENT ON TABLE sync_logs IS 'Tracks data synchronization operations';
COMMENT ON TABLE app_installations IS 'Tracks app installation and uninstallation events';
COMMENT ON TABLE billing_subscriptions IS 'Manages subscription and billing information';
COMMENT ON TABLE usage_metrics IS 'Tracks app usage metrics for billing and analytics';