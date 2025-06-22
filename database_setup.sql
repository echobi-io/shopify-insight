-- ShopifyIQ Database Schema
-- Run this in your Supabase SQL Editor to create the necessary tables

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'processed', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel);
CREATE INDEX IF NOT EXISTS idx_orders_customer_segment ON orders(customer_segment);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_refunds_created_at ON refunds(created_at);

-- Insert sample data
-- Sample customers
INSERT INTO customers (id, email, first_name, last_name, phone, created_at, customer_segment, total_spent, orders_count) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'john.doe@example.com', 'John', 'Doe', '+1234567890', '2024-01-15 10:00:00+00', 'vip', 2450.00, 8),
('550e8400-e29b-41d4-a716-446655440002', 'jane.smith@example.com', 'Jane', 'Smith', '+1234567891', '2024-02-20 14:30:00+00', 'returning', 890.50, 3),
('550e8400-e29b-41d4-a716-446655440003', 'bob.johnson@example.com', 'Bob', 'Johnson', '+1234567892', '2024-03-10 09:15:00+00', 'new', 156.99, 1),
('550e8400-e29b-41d4-a716-446655440004', 'alice.brown@example.com', 'Alice', 'Brown', '+1234567893', '2024-01-05 16:45:00+00', 'returning', 1200.75, 5),
('550e8400-e29b-41d4-a716-446655440005', 'charlie.wilson@example.com', 'Charlie', 'Wilson', '+1234567894', '2024-04-01 11:20:00+00', 'at_risk', 45.99, 1),
('550e8400-e29b-41d4-a716-446655440006', 'diana.davis@example.com', 'Diana', 'Davis', '+1234567895', '2024-02-14 13:10:00+00', 'vip', 3200.00, 12),
('550e8400-e29b-41d4-a716-446655440007', 'evan.miller@example.com', 'Evan', 'Miller', '+1234567896', '2024-03-25 08:30:00+00', 'new', 299.99, 2),
('550e8400-e29b-41d4-a716-446655440008', 'fiona.garcia@example.com', 'Fiona', 'Garcia', '+1234567897', '2024-01-30 15:45:00+00', 'returning', 675.25, 4);

-- Sample products
INSERT INTO products (id, name, description, price, cost, sku, category) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Premium Wireless Headphones', 'High-quality wireless headphones with noise cancellation', 299.99, 150.00, 'WH-001', 'Electronics'),
('660e8400-e29b-41d4-a716-446655440002', 'Smart Fitness Tracker', 'Advanced fitness tracker with heart rate monitoring', 199.99, 100.00, 'FT-002', 'Electronics'),
('660e8400-e29b-41d4-a716-446655440003', 'Organic Cotton T-Shirt', 'Comfortable organic cotton t-shirt', 29.99, 12.00, 'TS-003', 'Clothing'),
('660e8400-e29b-41d4-a716-446655440004', 'Stainless Steel Water Bottle', 'Insulated stainless steel water bottle', 39.99, 18.00, 'WB-004', 'Accessories'),
('660e8400-e29b-41d4-a716-446655440005', 'Bluetooth Speaker', 'Portable bluetooth speaker with premium sound', 89.99, 45.00, 'BS-005', 'Electronics'),
('660e8400-e29b-41d4-a716-446655440006', 'Yoga Mat', 'Non-slip yoga mat for all fitness levels', 49.99, 20.00, 'YM-006', 'Fitness'),
('660e8400-e29b-41d4-a716-446655440007', 'Coffee Mug Set', 'Set of 4 ceramic coffee mugs', 24.99, 10.00, 'CM-007', 'Home'),
('660e8400-e29b-41d4-a716-446655440008', 'Laptop Stand', 'Adjustable aluminum laptop stand', 79.99, 35.00, 'LS-008', 'Electronics');

-- Sample orders (recent data for the last 3 months)
INSERT INTO orders (id, customer_id, order_number, total_price, subtotal, tax_amount, shipping_amount, status, channel, customer_segment, created_at) VALUES
-- Recent orders (last 30 days)
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'ORD-2024-001', 329.98, 299.99, 24.00, 5.99, 'delivered', 'online', 'vip', '2024-06-20 10:30:00+00'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'ORD-2024-002', 219.98, 199.99, 16.00, 3.99, 'shipped', 'mobile', 'returning', '2024-06-19 14:15:00+00'),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'ORD-2024-003', 156.99, 149.99, 12.00, -5.00, 'delivered', 'social', 'new', '2024-06-18 09:45:00+00'),
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'ORD-2024-004', 94.98, 89.99, 7.20, -2.21, 'delivered', 'email', 'returning', '2024-06-17 16:20:00+00'),
('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'ORD-2024-005', 54.98, 49.99, 4.00, 0.99, 'confirmed', 'direct', 'at_risk', '2024-06-16 11:10:00+00'),
('770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 'ORD-2024-006', 129.97, 119.98, 9.60, 0.39, 'delivered', 'online', 'vip', '2024-06-15 13:25:00+00'),
('770e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', 'ORD-2024-007', 84.98, 79.99, 6.40, -1.41, 'shipped', 'mobile', 'new', '2024-06-14 08:50:00+00'),
('770e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', 'ORD-2024-008', 269.97, 249.98, 20.00, -0.01, 'delivered', 'online', 'returning', '2024-06-13 15:35:00+00'),

-- Orders from last month
('770e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440001', 'ORD-2024-009', 399.98, 379.98, 30.40, -10.40, 'delivered', 'online', 'vip', '2024-05-25 12:00:00+00'),
('770e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 'ORD-2024-010', 179.98, 169.99, 13.60, -3.61, 'delivered', 'email', 'returning', '2024-05-20 10:15:00+00'),
('770e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440004', 'ORD-2024-011', 124.97, 119.98, 9.60, -4.61, 'delivered', 'social', 'returning', '2024-05-18 14:30:00+00'),
('770e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440006', 'ORD-2024-012', 459.96, 439.97, 35.20, -15.21, 'delivered', 'online', 'vip', '2024-05-15 09:45:00+00'),
('770e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440007', 'ORD-2024-013', 109.98, 104.99, 8.40, -3.41, 'delivered', 'mobile', 'new', '2024-05-12 16:20:00+00'),
('770e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440008', 'ORD-2024-014', 199.97, 189.98, 15.20, -5.21, 'delivered', 'direct', 'returning', '2024-05-10 11:10:00+00'),

-- Orders from 2 months ago
('770e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440001', 'ORD-2024-015', 289.98, 279.99, 22.40, -12.41, 'delivered', 'online', 'vip', '2024-04-28 13:25:00+00'),
('770e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440004', 'ORD-2024-016', 149.98, 139.99, 11.20, -1.21, 'delivered', 'email', 'returning', '2024-04-25 08:50:00+00'),
('770e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440006', 'ORD-2024-017', 359.96, 339.97, 27.20, -7.21, 'delivered', 'online', 'vip', '2024-04-22 15:35:00+00'),
('770e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440008', 'ORD-2024-018', 89.99, 84.99, 6.80, -1.80, 'delivered', 'social', 'returning', '2024-04-20 12:00:00+00');

-- Sample order items
INSERT INTO order_items (order_id, product_id, quantity, price, total) VALUES
-- Items for recent orders
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 1, 299.99, 299.99),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 1, 199.99, 199.99),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', 1, 199.99, 199.99),
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440005', 1, 89.99, 89.99),
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440006', 1, 49.99, 49.99),
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440007', 2, 24.99, 49.98),
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440008', 1, 79.99, 79.99),
('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440008', 1, 79.99, 79.99),
('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440001', 1, 299.99, 299.99),

-- Items for last month orders
('770e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440001', 1, 299.99, 299.99),
('770e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440008', 1, 79.99, 79.99),
('770e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440002', 1, 199.99, 199.99),
('770e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440005', 1, 89.99, 89.99),
('770e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440003', 1, 29.99, 29.99),
('770e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440001', 1, 299.99, 299.99),
('770e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440002', 1, 199.99, 199.99),
('770e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440006', 1, 49.99, 49.99),
('770e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440004', 1, 39.99, 39.99),
('770e8400-e29b-41d4-a716-446655440014', '660e8400-e29b-41d4-a716-446655440002', 1, 199.99, 199.99),

-- Items for 2 months ago orders
('770e8400-e29b-41d4-a716-446655440015', '660e8400-e29b-41d4-a716-446655440001', 1, 299.99, 299.99),
('770e8400-e29b-41d4-a716-446655440016', '660e8400-e29b-41d4-a716-446655440002', 1, 199.99, 199.99),
('770e8400-e29b-41d4-a716-446655440017', '660e8400-e29b-41d4-a716-446655440001', 1, 299.99, 299.99),
('770e8400-e29b-41d4-a716-446655440017', '660e8400-e29b-41d4-a716-446655440004', 1, 39.99, 39.99),
('770e8400-e29b-41d4-a716-446655440018', '660e8400-e29b-41d4-a716-446655440005', 1, 89.99, 89.99);

-- Sample refunds
INSERT INTO refunds (order_id, product_id, amount, reason, status, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', 50.00, 'Defective item', 'processed', '2024-06-19 10:00:00+00'),
('770e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440002', 25.00, 'Customer changed mind', 'processed', '2024-05-22 14:30:00+00'),
('770e8400-e29b-41d4-a716-446655440015', '660e8400-e29b-41d4-a716-446655440001', 75.00, 'Wrong size', 'processed', '2024-04-30 09:15:00+00');

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