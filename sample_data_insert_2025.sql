-- Sample data for EchoIQ dashboard - Updated for 2025
-- This script inserts sample orders data for the hardcoded merchant ID

-- First, let's clear existing sample data
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE merchant_id = '11111111-1111-1111-1111-111111111111');
DELETE FROM orders WHERE merchant_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM customers WHERE merchant_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM products WHERE merchant_id = '11111111-1111-1111-1111-111111111111';

-- Insert sample customers
INSERT INTO customers (id, merchant_id, customer_name, email, total_spent, order_count, avg_order_value, first_order_date, last_order_date, created_at, updated_at)
VALUES 
  ('cust-001', '11111111-1111-1111-1111-111111111111', 'John Smith', 'john.smith@example.com', 1250.00, 5, 250.00, '2025-01-15', '2025-06-20', NOW(), NOW()),
  ('cust-002', '11111111-1111-1111-1111-111111111111', 'Sarah Johnson', 'sarah.j@example.com', 890.00, 3, 296.67, '2025-02-10', '2025-05-15', NOW(), NOW()),
  ('cust-003', '11111111-1111-1111-1111-111111111111', 'Mike Wilson', 'mike.w@example.com', 2100.00, 7, 300.00, '2025-01-05', '2025-06-25', NOW(), NOW()),
  ('cust-004', '11111111-1111-1111-1111-111111111111', 'Emma Davis', 'emma.d@example.com', 650.00, 2, 325.00, '2025-03-20', '2025-04-10', NOW(), NOW()),
  ('cust-005', '11111111-1111-1111-1111-111111111111', 'David Brown', 'david.b@example.com', 1800.00, 6, 300.00, '2025-01-25', '2025-06-30', NOW(), NOW());

-- Insert sample products
INSERT INTO products (id, merchant_id, title, vendor, product_type, price, cost, inventory_quantity, is_active, created_at, updated_at)
VALUES 
  ('prod-001', '11111111-1111-1111-1111-111111111111', 'Premium Wireless Headphones', 'TechCorp', 'Electronics', 299.99, 150.00, 50, true, NOW(), NOW()),
  ('prod-002', '11111111-1111-1111-1111-111111111111', 'Smart Fitness Watch', 'FitTech', 'Wearables', 199.99, 100.00, 75, true, NOW(), NOW()),
  ('prod-003', '11111111-1111-1111-1111-111111111111', 'Bluetooth Speaker', 'AudioMax', 'Electronics', 89.99, 45.00, 100, true, NOW(), NOW()),
  ('prod-004', '11111111-1111-1111-1111-111111111111', 'Laptop Stand', 'OfficeGear', 'Accessories', 49.99, 25.00, 200, true, NOW(), NOW()),
  ('prod-005', '11111111-1111-1111-1111-111111111111', 'USB-C Hub', 'TechCorp', 'Electronics', 79.99, 40.00, 150, true, NOW(), NOW());

-- Insert sample orders with varied dates throughout 2025
INSERT INTO orders (id, merchant_id, customer_id, order_number, total_price, subtotal_price, total_tax, shipping_cost, discount_amount, currency, created_at, updated_at)
VALUES 
  -- January 2025
  ('order-001', '11111111-1111-1111-1111-111111111111', 'cust-001', 'ORD-001', 299.99, 299.99, 24.00, 0.00, 0.00, 'USD', '2025-01-15 10:30:00', '2025-01-15 10:30:00'),
  ('order-002', '11111111-1111-1111-1111-111111111111', 'cust-003', 'ORD-002', 389.98, 389.98, 31.20, 0.00, 0.00, 'USD', '2025-01-20 14:15:00', '2025-01-20 14:15:00'),
  ('order-003', '11111111-1111-1111-1111-111111111111', 'cust-005', 'ORD-003', 199.99, 199.99, 16.00, 0.00, 0.00, 'USD', '2025-01-25 09:45:00', '2025-01-25 09:45:00'),
  
  -- February 2025
  ('order-004', '11111111-1111-1111-1111-111111111111', 'cust-002', 'ORD-004', 249.98, 249.98, 20.00, 0.00, 0.00, 'USD', '2025-02-10 16:20:00', '2025-02-10 16:20:00'),
  ('order-005', '11111111-1111-1111-1111-111111111111', 'cust-001', 'ORD-005', 89.99, 89.99, 7.20, 0.00, 0.00, 'USD', '2025-02-14 11:30:00', '2025-02-14 11:30:00'),
  ('order-006', '11111111-1111-1111-1111-111111111111', 'cust-003', 'ORD-006', 129.98, 129.98, 10.40, 0.00, 0.00, 'USD', '2025-02-28 13:45:00', '2025-02-28 13:45:00'),
  
  -- March 2025
  ('order-007', '11111111-1111-1111-1111-111111111111', 'cust-004', 'ORD-007', 299.99, 299.99, 24.00, 0.00, 0.00, 'USD', '2025-03-05 15:10:00', '2025-03-05 15:10:00'),
  ('order-008', '11111111-1111-1111-1111-111111111111', 'cust-005', 'ORD-008', 179.98, 179.98, 14.40, 0.00, 0.00, 'USD', '2025-03-12 12:25:00', '2025-03-12 12:25:00'),
  ('order-009', '11111111-1111-1111-1111-111111111111', 'cust-001', 'ORD-009', 49.99, 49.99, 4.00, 0.00, 0.00, 'USD', '2025-03-20 08:50:00', '2025-03-20 08:50:00'),
  
  -- April 2025
  ('order-010', '11111111-1111-1111-1111-111111111111', 'cust-002', 'ORD-010', 379.98, 379.98, 30.40, 0.00, 0.00, 'USD', '2025-04-08 17:30:00', '2025-04-08 17:30:00'),
  ('order-011', '11111111-1111-1111-1111-111111111111', 'cust-004', 'ORD-011', 349.99, 349.99, 28.00, 0.00, 0.00, 'USD', '2025-04-15 10:15:00', '2025-04-15 10:15:00'),
  ('order-012', '11111111-1111-1111-1111-111111111111', 'cust-003', 'ORD-012', 199.99, 199.99, 16.00, 0.00, 0.00, 'USD', '2025-04-22 14:40:00', '2025-04-22 14:40:00'),
  
  -- May 2025
  ('order-013', '11111111-1111-1111-1111-111111111111', 'cust-005', 'ORD-013', 289.98, 289.98, 23.20, 0.00, 0.00, 'USD', '2025-05-03 11:20:00', '2025-05-03 11:20:00'),
  ('order-014', '11111111-1111-1111-1111-111111111111', 'cust-001', 'ORD-014', 159.99, 159.99, 12.80, 0.00, 0.00, 'USD', '2025-05-10 16:45:00', '2025-05-10 16:45:00'),
  ('order-015', '11111111-1111-1111-1111-111111111111', 'cust-002', 'ORD-015', 259.99, 259.99, 20.80, 0.00, 0.00, 'USD', '2025-05-18 09:30:00', '2025-05-18 09:30:00'),
  
  -- June 2025
  ('order-016', '11111111-1111-1111-1111-111111111111', 'cust-003', 'ORD-016', 449.97, 449.97, 36.00, 0.00, 0.00, 'USD', '2025-06-05 13:15:00', '2025-06-05 13:15:00'),
  ('order-017', '11111111-1111-1111-1111-111111111111', 'cust-001', 'ORD-017', 399.98, 399.98, 32.00, 0.00, 0.00, 'USD', '2025-06-12 15:50:00', '2025-06-12 15:50:00'),
  ('order-018', '11111111-1111-1111-1111-111111111111', 'cust-005', 'ORD-018', 179.99, 179.99, 14.40, 0.00, 0.00, 'USD', '2025-06-20 12:10:00', '2025-06-20 12:10:00'),
  ('order-019', '11111111-1111-1111-1111-111111111111', 'cust-003', 'ORD-019', 299.99, 299.99, 24.00, 0.00, 0.00, 'USD', '2025-06-25 10:25:00', '2025-06-25 10:25:00'),
  ('order-020', '11111111-1111-1111-1111-111111111111', 'cust-005', 'ORD-020', 549.97, 549.97, 44.00, 0.00, 0.00, 'USD', '2025-06-30 14:35:00', '2025-06-30 14:35:00'),
  
  -- July 2025 (current month data)
  ('order-021', '11111111-1111-1111-1111-111111111111', 'cust-001', 'ORD-021', 199.99, 199.99, 16.00, 0.00, 0.00, 'USD', '2025-07-05 11:30:00', '2025-07-05 11:30:00'),
  ('order-022', '11111111-1111-1111-1111-111111111111', 'cust-002', 'ORD-022', 149.99, 149.99, 12.00, 0.00, 0.00, 'USD', '2025-07-10 14:20:00', '2025-07-10 14:20:00'),
  ('order-023', '11111111-1111-1111-1111-111111111111', 'cust-003', 'ORD-023', 89.99, 89.99, 7.20, 0.00, 0.00, 'USD', '2025-07-12 16:45:00', '2025-07-12 16:45:00');

-- Insert corresponding order items
INSERT INTO order_items (id, order_id, product_id, quantity, price, total, created_at, updated_at)
VALUES 
  -- Order 1 items
  ('item-001', 'order-001', 'prod-001', 1, 299.99, 299.99, '2025-01-15 10:30:00', '2025-01-15 10:30:00'),
  
  -- Order 2 items
  ('item-002', 'order-002', 'prod-002', 1, 199.99, 199.99, '2025-01-20 14:15:00', '2025-01-20 14:15:00'),
  ('item-003', 'order-002', 'prod-003', 1, 89.99, 89.99, '2025-01-20 14:15:00', '2025-01-20 14:15:00'),
  ('item-004', 'order-002', 'prod-005', 1, 79.99, 79.99, '2025-01-20 14:15:00', '2025-01-20 14:15:00'),
  
  -- Order 3 items
  ('item-005', 'order-003', 'prod-002', 1, 199.99, 199.99, '2025-01-25 09:45:00', '2025-01-25 09:45:00'),
  
  -- Order 4 items
  ('item-006', 'order-004', 'prod-002', 1, 199.99, 199.99, '2025-02-10 16:20:00', '2025-02-10 16:20:00'),
  ('item-007', 'order-004', 'prod-004', 1, 49.99, 49.99, '2025-02-10 16:20:00', '2025-02-10 16:20:00'),
  
  -- Order 5 items
  ('item-008', 'order-005', 'prod-003', 1, 89.99, 89.99, '2025-02-14 11:30:00', '2025-02-14 11:30:00'),
  
  -- Order 6 items
  ('item-009', 'order-006', 'prod-004', 1, 49.99, 49.99, '2025-02-28 13:45:00', '2025-02-28 13:45:00'),
  ('item-010', 'order-006', 'prod-005', 1, 79.99, 79.99, '2025-02-28 13:45:00', '2025-02-28 13:45:00'),
  
  -- Order 7 items
  ('item-011', 'order-007', 'prod-001', 1, 299.99, 299.99, '2025-03-05 15:10:00', '2025-03-05 15:10:00'),
  
  -- Order 8 items
  ('item-012', 'order-008', 'prod-003', 2, 89.99, 179.98, '2025-03-12 12:25:00', '2025-03-12 12:25:00'),
  
  -- Order 9 items
  ('item-013', 'order-009', 'prod-004', 1, 49.99, 49.99, '2025-03-20 08:50:00', '2025-03-20 08:50:00'),
  
  -- Order 10 items
  ('item-014', 'order-010', 'prod-001', 1, 299.99, 299.99, '2025-04-08 17:30:00', '2025-04-08 17:30:00'),
  ('item-015', 'order-010', 'prod-005', 1, 79.99, 79.99, '2025-04-08 17:30:00', '2025-04-08 17:30:00'),
  
  -- Order 11 items
  ('item-016', 'order-011', 'prod-001', 1, 299.99, 299.99, '2025-04-15 10:15:00', '2025-04-15 10:15:00'),
  ('item-017', 'order-011', 'prod-004', 1, 49.99, 49.99, '2025-04-15 10:15:00', '2025-04-15 10:15:00'),
  
  -- Order 12 items
  ('item-018', 'order-012', 'prod-002', 1, 199.99, 199.99, '2025-04-22 14:40:00', '2025-04-22 14:40:00'),
  
  -- Order 13 items
  ('item-019', 'order-013', 'prod-002', 1, 199.99, 199.99, '2025-05-03 11:20:00', '2025-05-03 11:20:00'),
  ('item-020', 'order-013', 'prod-003', 1, 89.99, 89.99, '2025-05-03 11:20:00', '2025-05-03 11:20:00'),
  
  -- Order 14 items
  ('item-021', 'order-014', 'prod-002', 1, 159.99, 159.99, '2025-05-10 16:45:00', '2025-05-10 16:45:00'),
  
  -- Order 15 items
  ('item-022', 'order-015', 'prod-001', 1, 259.99, 259.99, '2025-05-18 09:30:00', '2025-05-18 09:30:00'),
  
  -- Order 16 items
  ('item-023', 'order-016', 'prod-001', 1, 299.99, 299.99, '2025-06-05 13:15:00', '2025-06-05 13:15:00'),
  ('item-024', 'order-016', 'prod-002', 1, 149.98, 149.98, '2025-06-05 13:15:00', '2025-06-05 13:15:00'),
  
  -- Order 17 items
  ('item-025', 'order-017', 'prod-002', 2, 199.99, 399.98, '2025-06-12 15:50:00', '2025-06-12 15:50:00'),
  
  -- Order 18 items
  ('item-026', 'order-018', 'prod-003', 2, 89.99, 179.98, '2025-06-20 12:10:00', '2025-06-20 12:10:00'),
  
  -- Order 19 items
  ('item-027', 'order-019', 'prod-001', 1, 299.99, 299.99, '2025-06-25 10:25:00', '2025-06-25 10:25:00'),
  
  -- Order 20 items
  ('item-028', 'order-020', 'prod-001', 1, 299.99, 299.99, '2025-06-30 14:35:00', '2025-06-30 14:35:00'),
  ('item-029', 'order-020', 'prod-002', 1, 199.99, 199.99, '2025-06-30 14:35:00', '2025-06-30 14:35:00'),
  ('item-030', 'order-020', 'prod-004', 1, 49.99, 49.99, '2025-06-30 14:35:00', '2025-06-30 14:35:00'),
  
  -- July 2025 items
  ('item-031', 'order-021', 'prod-002', 1, 199.99, 199.99, '2025-07-05 11:30:00', '2025-07-05 11:30:00'),
  ('item-032', 'order-022', 'prod-003', 1, 149.99, 149.99, '2025-07-10 14:20:00', '2025-07-10 14:20:00'),
  ('item-033', 'order-023', 'prod-003', 1, 89.99, 89.99, '2025-07-12 16:45:00', '2025-07-12 16:45:00');

-- Update customer totals based on the orders
UPDATE customers SET 
  total_spent = (
    SELECT COALESCE(SUM(total_price), 0) 
    FROM orders 
    WHERE orders.customer_id = customers.id
  ),
  order_count = (
    SELECT COUNT(*) 
    FROM orders 
    WHERE orders.customer_id = customers.id
  ),
  avg_order_value = (
    SELECT COALESCE(AVG(total_price), 0) 
    FROM orders 
    WHERE orders.customer_id = customers.id
  ),
  first_order_date = (
    SELECT MIN(created_at) 
    FROM orders 
    WHERE orders.customer_id = customers.id
  ),
  last_order_date = (
    SELECT MAX(created_at) 
    FROM orders 
    WHERE orders.customer_id = customers.id
  )
WHERE merchant_id = '11111111-1111-1111-1111-111111111111';

-- Update settings for the merchant (ensure 2025 is current financial year)
INSERT INTO settings (merchant_id, financial_year_start, financial_year_end, default_date_range, timezone, currency, churn_period_days, cost_of_acquisition, gross_profit_margin, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '01-01',
  '12-31', 
  'financial_current',
  'UTC',
  'USD',
  180,
  50.00,
  30.00,
  NOW(),
  NOW()
) ON CONFLICT (merchant_id) DO UPDATE SET
  financial_year_start = EXCLUDED.financial_year_start,
  financial_year_end = EXCLUDED.financial_year_end,
  default_date_range = EXCLUDED.default_date_range,
  timezone = EXCLUDED.timezone,
  currency = EXCLUDED.currency,
  churn_period_days = EXCLUDED.churn_period_days,
  cost_of_acquisition = EXCLUDED.cost_of_acquisition,
  gross_profit_margin = EXCLUDED.gross_profit_margin,
  updated_at = NOW();