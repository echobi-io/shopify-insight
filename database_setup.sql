-- ShopifyIQ Database Schema (with merchant_id for multi-tenancy)
-- Run this in your Supabase SQL Editor to create the necessary tables

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_spent DECIMAL(10,2) DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  last_order_date TIMESTAMP WITH TIME ZONE,
  customer_segment VARCHAR(50) DEFAULT 'new' -- 'new', 'returning', 'vip', 'at_risk'
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2),
  sku VARCHAR(100) UNIQUE,
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL,
  customer_id UUID REFERENCES customers(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
  channel VARCHAR(50) DEFAULT 'online', -- 'online', 'mobile', 'social', 'email', 'direct'
  customer_segment VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL,
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'processed', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_merchant_id ON customers(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_merchant_id ON products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant_id ON orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_merchant_id ON order_items(merchant_id);
CREATE INDEX IF NOT EXISTS idx_refunds_merchant_id ON refunds(merchant_id);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel);
CREATE INDEX IF NOT EXISTS idx_orders_customer_segment ON orders(customer_segment);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_refunds_created_at ON refunds(created_at);

-- No sample data - tables will be populated with your real business data

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- Create policies to allow read access (adjust based on your auth requirements)
CREATE POLICY "Allow read access to customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow read access to products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow read access to orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow read access to order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Allow read access to refunds" ON refunds FOR SELECT USING (true);