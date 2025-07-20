-- Create essential Shopify tables for echoSignal app
-- Run this script in your Supabase SQL editor

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
  sync_status VARCHAR(50) DEFAULT 'pending'
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shops_domain_active ON shops(shop_domain, is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_events_shop_topic ON webhook_events(shop_id, topic);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed, created_at);

-- Add shop_id to existing tables if they exist
DO $$
BEGIN
  -- Add shop_id to orders table if it exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
  END IF;

  -- Add shop_id to customers table if it exists  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customers') THEN
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON customers(shop_id);
  END IF;

  -- Add shop_id to products table if it exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
    ALTER TABLE products ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
  END IF;

  -- Add shop_id to settings table if it exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'settings') THEN
    ALTER TABLE settings ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_settings_shop_id ON settings(shop_id);
  END IF;

  -- Add shop_id to user_settings table if it exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_settings') THEN
    ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_user_settings_shop_id ON user_settings(shop_id);
  END IF;

  -- Add shop_id to subscription table if it exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subscription') THEN
    ALTER TABLE subscription ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_subscription_shop_id ON subscription(shop_id);
  END IF;
END $$;

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

-- Add domain format constraint
ALTER TABLE shops ADD CONSTRAINT IF NOT EXISTS shops_domain_format 
  CHECK (shop_domain ~ '^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$');

-- Insert a test shop for development (you can remove this later)
INSERT INTO shops (shop_domain, access_token, scope, shop_name, is_active) 
VALUES ('echobi.myshopify.com', 'test_token', 'read_orders,read_products,read_customers', 'Echo BI Test Shop', true)
ON CONFLICT (shop_domain) DO NOTHING;

COMMENT ON TABLE shops IS 'Stores information about connected Shopify shops';
COMMENT ON TABLE webhook_events IS 'Logs all webhook events received from Shopify';