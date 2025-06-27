-- Churn & LTV Database Tables for ShopifyIQ
-- Run this in your Supabase SQL Editor after the main schema

-- Create churn_predictions table
CREATE TABLE IF NOT EXISTS churn_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  merchant_id UUID NOT NULL,
  churn_probability FLOAT NOT NULL,
  churn_band TEXT NOT NULL CHECK (churn_band IN ('High', 'Medium', 'Low')),
  revenue_at_risk FLOAT NOT NULL DEFAULT 0,
  predicted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ltv_predictions table
CREATE TABLE IF NOT EXISTS ltv_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  merchant_id UUID NOT NULL,
  predicted_ltv FLOAT NOT NULL,
  confidence FLOAT NOT NULL DEFAULT 0.5,
  predicted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_churn_predictions_merchant_id ON churn_predictions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_customer_id ON churn_predictions(customer_id);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_churn_band ON churn_predictions(churn_band);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_predicted_at ON churn_predictions(predicted_at);

CREATE INDEX IF NOT EXISTS idx_ltv_predictions_merchant_id ON ltv_predictions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_ltv_predictions_customer_id ON ltv_predictions(customer_id);
CREATE INDEX IF NOT EXISTS idx_ltv_predictions_predicted_at ON ltv_predictions(predicted_at);

-- Enable Row Level Security
ALTER TABLE churn_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ltv_predictions ENABLE ROW LEVEL SECURITY;

-- Create policies for read access
CREATE POLICY "Allow read access to churn_predictions" ON churn_predictions FOR SELECT USING (true);
CREATE POLICY "Allow read access to ltv_predictions" ON ltv_predictions FOR SELECT USING (true);

-- Insert sample churn predictions data
-- Using the same merchant_id: '11111111-1111-1111-1111-111111111111'
INSERT INTO churn_predictions (customer_id, merchant_id, churn_probability, churn_band, revenue_at_risk, predicted_at) VALUES
-- High risk customers
('550e8400-e29b-41d4-a716-446655440005', '11111111-1111-1111-1111-111111111111', 0.85, 'High', 450.00, NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440003', '11111111-1111-1111-1111-111111111111', 0.72, 'High', 320.00, NOW() - INTERVAL '2 days'),

-- Medium risk customers
('550e8400-e29b-41d4-a716-446655440007', '11111111-1111-1111-1111-111111111111', 0.45, 'Medium', 280.00, NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440008', '11111111-1111-1111-1111-111111111111', 0.38, 'Medium', 675.25, NOW() - INTERVAL '3 days'),

-- Low risk customers
('550e8400-e29b-41d4-a716-446655440001', '11111111-1111-1111-1111-111111111111', 0.15, 'Low', 150.00, NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440002', '11111111-1111-1111-1111-111111111111', 0.22, 'Low', 200.00, NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440004', '11111111-1111-1111-1111-111111111111', 0.18, 'Low', 300.00, NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440006', '11111111-1111-1111-1111-111111111111', 0.12, 'Low', 400.00, NOW() - INTERVAL '2 days');

-- Insert sample LTV predictions data
INSERT INTO ltv_predictions (customer_id, merchant_id, predicted_ltv, confidence, predicted_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', '11111111-1111-1111-1111-111111111111', 3200.00, 0.85, NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440002', '11111111-1111-1111-1111-111111111111', 1450.00, 0.78, NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440003', '11111111-1111-1111-1111-111111111111', 420.00, 0.65, NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440004', '11111111-1111-1111-1111-111111111111', 2100.00, 0.82, NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440005', '11111111-1111-1111-1111-111111111111', 180.00, 0.45, NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440006', '11111111-1111-1111-1111-111111111111', 4500.00, 0.92, NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440007', '11111111-1111-1111-1111-111111111111', 850.00, 0.72, NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440008', '11111111-1111-1111-1111-111111111111', 1200.00, 0.75, NOW() - INTERVAL '3 days');

-- Grant necessary permissions
GRANT SELECT ON churn_predictions TO anon, authenticated;
GRANT SELECT ON ltv_predictions TO anon, authenticated;