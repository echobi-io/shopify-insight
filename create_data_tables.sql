-- Create data tables for Shopify sync
-- Run this after the essential tables script

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(255) PRIMARY KEY,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    email VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(50),
    accepts_marketing BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    orders_count INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    tags TEXT,
    state VARCHAR(50),
    verified_email BOOLEAN DEFAULT false,
    tax_exempt BOOLEAN DEFAULT false,
    currency VARCHAR(10)
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(255) PRIMARY KEY,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    title VARCHAR(500),
    body_html TEXT,
    vendor VARCHAR(255),
    product_type VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50),
    tags TEXT,
    variants JSONB,
    images JSONB
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    currency VARCHAR(10),
    total_price DECIMAL(10,2),
    subtotal_price DECIMAL(10,2),
    total_tax DECIMAL(10,2),
    total_discounts DECIMAL(10,2),
    financial_status VARCHAR(50),
    fulfillment_status VARCHAR(50),
    customer_id VARCHAR(255),
    line_items JSONB,
    shipping_address JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_title ON products(title);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- Create settings table for shop-specific settings
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    merchant_id VARCHAR(255) DEFAULT '111111',
    data_period INTEGER DEFAULT 30,
    churn_days INTEGER DEFAULT 90,
    currency VARCHAR(10) DEFAULT 'USD',
    timezone VARCHAR(100) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shop_id)
);

-- Insert default settings for existing shop
INSERT INTO settings (shop_id, merchant_id, data_period, churn_days, currency)
SELECT id, 'echobi-shop', 30, 90, 'USD'
FROM shops 
WHERE shop_domain = 'echobi.myshopify.com'
ON CONFLICT (shop_id) DO NOTHING;