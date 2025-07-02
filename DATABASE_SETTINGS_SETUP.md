# Settings Table Setup Instructions

The application is currently failing because the `settings` table doesn't exist in the database. You need to create this table to store application settings per merchant.

## Steps to Create the Settings Table

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the "SQL Editor" section
3. Create a new query and paste the following SQL:

```sql
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
    FOR SELECT USING (true);

CREATE POLICY "Merchants can insert their own settings" ON settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Merchants can update their own settings" ON settings
    FOR UPDATE USING (true);

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
```

4. Click "Run" to execute the SQL
5. Verify the table was created by checking the "Table Editor" section

### Option 2: Using psql Command Line

If you have direct database access via psql:

```bash
psql "your-database-connection-string" -f create_settings_table.sql
```

## What This Fixes

Creating the settings table will resolve:

1. **Settings Loading Errors**: The app will be able to load and save user settings
2. **Date Range Persistence**: Selected date ranges will persist across page refreshes
3. **Default Data Period**: The default data period setting will flow through to all pages
4. **Churn Analysis Settings**: Churn period days will be configurable and persistent

## Verification

After creating the table, you should see:

1. No more "relation 'public.settings' does not exist" errors in the console
2. Settings page should load and save properly
3. Date selectors should remember your selections
4. Default data periods should work across all pages

## Files Already Updated

The following files have been updated to work with the database-backed settings:

- `src/lib/fetchers/getSettingsData.ts` - Database operations for settings
- `src/lib/utils/settingsUtils.ts` - Settings utilities with caching
- `src/pages/settings.tsx` - Settings page with database integration
- All dashboard pages - Updated to use database settings for initial timeframes

Once you create the settings table, the application should work properly without the current errors.