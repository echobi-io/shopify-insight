-- Fix settings table to ensure all required columns exist
-- This script will create the table if it doesn't exist, or add missing columns if it does

-- First, create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(merchant_id)
);

-- Add all required columns with proper defaults (using ALTER TABLE ADD COLUMN IF NOT EXISTS)
-- Note: PostgreSQL doesn't have "ADD COLUMN IF NOT EXISTS" so we'll use DO blocks

DO $$ 
BEGIN
    -- Financial Year Settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'financial_year_start') THEN
        ALTER TABLE settings ADD COLUMN financial_year_start VARCHAR(5) NOT NULL DEFAULT '01-01';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'financial_year_end') THEN
        ALTER TABLE settings ADD COLUMN financial_year_end VARCHAR(5) NOT NULL DEFAULT '12-31';
    END IF;
    
    -- Application Settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'default_date_range') THEN
        ALTER TABLE settings ADD COLUMN default_date_range VARCHAR(50) NOT NULL DEFAULT 'financial_current';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'timezone') THEN
        ALTER TABLE settings ADD COLUMN timezone VARCHAR(50) NOT NULL DEFAULT 'UTC';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'currency') THEN
        ALTER TABLE settings ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'USD';
    END IF;
    
    -- Customer Analytics Settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'churn_period_days') THEN
        ALTER TABLE settings ADD COLUMN churn_period_days INTEGER NOT NULL DEFAULT 180;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'cost_of_acquisition') THEN
        ALTER TABLE settings ADD COLUMN cost_of_acquisition DECIMAL(10,2) NOT NULL DEFAULT 50.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'gross_profit_margin') THEN
        ALTER TABLE settings ADD COLUMN gross_profit_margin DECIMAL(5,2) NOT NULL DEFAULT 30.00;
    END IF;
END $$;

-- Create index for faster lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_settings_merchant_id ON settings(merchant_id);

-- Enable RLS (Row Level Security)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Merchants can view their own settings" ON settings;
DROP POLICY IF EXISTS "Merchants can insert their own settings" ON settings;
DROP POLICY IF EXISTS "Merchants can update their own settings" ON settings;

-- Create policies to allow access (using permissive policies for now)
CREATE POLICY "Merchants can view their own settings" ON settings
    FOR SELECT USING (true);

CREATE POLICY "Merchants can insert their own settings" ON settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Merchants can update their own settings" ON settings
    FOR UPDATE USING (true);

-- Insert or update default settings for the test merchant
INSERT INTO settings (
    merchant_id,
    financial_year_start,
    financial_year_end,
    default_date_range,
    timezone,
    currency,
    churn_period_days,
    cost_of_acquisition,
    gross_profit_margin,
    updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '01-01',
    '12-31',
    'financial_current',
    'UTC',
    'USD',
    180,
    50.00,
    30.00,
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

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'settings' 
ORDER BY ordinal_position;