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

-- No sample data - tables will be populated by your actual ML predictions

-- Grant necessary permissions
GRANT SELECT ON churn_predictions TO anon, authenticated;
GRANT SELECT ON ltv_predictions TO anon, authenticated;