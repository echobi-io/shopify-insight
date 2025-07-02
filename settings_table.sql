-- Create settings table for storing application settings per merchant
CREATE TABLE IF NOT EXISTS settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID NOT NULL,
    financial_year_start VARCHAR(5) NOT NULL DEFAULT '01-01', -- MM-DD format
    financial_year_end VARCHAR(5) NOT NULL DEFAULT '12-31',   -- MM-DD format
    default_date_range VARCHAR(50) NOT NULL DEFAULT 'financial_current',
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    churn_period_days INTEGER NOT NULL DEFAULT 180,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one settings record per merchant
    UNIQUE(merchant_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_merchant_id ON settings(merchant_id);

-- Add RLS (Row Level Security) if needed
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow merchants to access only their own settings
CREATE POLICY "Merchants can view their own settings" ON settings
    FOR SELECT USING (merchant_id = auth.uid()::uuid);

CREATE POLICY "Merchants can insert their own settings" ON settings
    FOR INSERT WITH CHECK (merchant_id = auth.uid()::uuid);

CREATE POLICY "Merchants can update their own settings" ON settings
    FOR UPDATE USING (merchant_id = auth.uid()::uuid);

-- Insert default settings for the test merchant if not exists
INSERT INTO settings (
    merchant_id,
    financial_year_start,
    financial_year_end,
    default_date_range,
    timezone,
    currency,
    churn_period_days
) VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '01-01',
    '12-31',
    'financial_current',
    'UTC',
    'USD',
    180
) ON CONFLICT (merchant_id) DO NOTHING;