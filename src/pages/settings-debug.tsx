import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getSettings, saveSettings, AppSettings, DEFAULT_SETTINGS } from '@/lib/fetchers/getSettingsData'
import { supabase } from '@/lib/supabaseClient'

const MERCHANT_ID = '11111111-1111-1111-1111-111111111111'

const SettingsDebugPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tableExists, setTableExists] = useState<boolean | null>(null)
  const [rawData, setRawData] = useState<any>(null)

  const checkTableExists = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('count(*)')
        .limit(1)
      
      if (error) {
        console.error('Table check error:', error)
        setTableExists(false)
        setError(`Table error: ${error.message}`)
      } else {
        setTableExists(true)
        console.log('Table exists, count result:', data)
      }
    } catch (err) {
      console.error('Table check exception:', err)
      setTableExists(false)
      setError(`Table check failed: ${err}`)
    }
  }

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // First check raw data
      const { data: rawSettings, error: rawError } = await supabase
        .from('settings')
        .select('*')
        .eq('merchant_id', MERCHANT_ID)
        .single()
      
      console.log('Raw settings query result:', { rawSettings, rawError })
      setRawData({ rawSettings, rawError })
      
      // Then use our function
      const loadedSettings = await getSettings(MERCHANT_ID)
      console.log('Processed settings:', loadedSettings)
      setSettings(loadedSettings)
      
    } catch (err) {
      console.error('Load settings error:', err)
      setError(`Load error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const testSaveSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const testSettings: AppSettings = {
        ...DEFAULT_SETTINGS,
        merchant_id: MERCHANT_ID,
        defaultDateRange: 'last_30_days',
        currency: 'GBP',
        churnPeriodDays: 90
      }
      
      console.log('Attempting to save:', testSettings)
      const success = await saveSettings(testSettings)
      console.log('Save result:', success)
      
      if (success) {
        await loadSettings() // Reload to verify
      } else {
        setError('Save failed')
      }
      
    } catch (err) {
      console.error('Save settings error:', err)
      setError(`Save error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const createTable = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Create the table with all required columns
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS settings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          merchant_id UUID NOT NULL,
          financial_year_start VARCHAR(5) NOT NULL DEFAULT '01-01',
          financial_year_end VARCHAR(5) NOT NULL DEFAULT '12-31',
          default_date_range VARCHAR(50) NOT NULL DEFAULT 'financial_current',
          timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
          currency VARCHAR(3) NOT NULL DEFAULT 'USD',
          churn_period_days INTEGER NOT NULL DEFAULT 180,
          cost_of_acquisition DECIMAL(10,2) NOT NULL DEFAULT 50.00,
          gross_profit_margin DECIMAL(5,2) NOT NULL DEFAULT 30.00,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(merchant_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_settings_merchant_id ON settings(merchant_id);
        
        INSERT INTO settings (
          merchant_id,
          financial_year_start,
          financial_year_end,
          default_date_range,
          timezone,
          currency,
          churn_period_days,
          cost_of_acquisition,
          gross_profit_margin
        ) VALUES (
          '11111111-1111-1111-1111-111111111111'::uuid,
          '01-01',
          '12-31',
          'financial_current',
          'UTC',
          'USD',
          180,
          50.00,
          30.00
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
      `
      
      // Execute the SQL directly using supabase client
      const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL })
      
      if (error) {
        console.error('Create table error:', error)
        setError(`Create table error: ${error.message}`)
      } else {
        console.log('Table created successfully')
        await checkTableExists()
        await loadSettings() // Reload settings after creating table
      }
      
    } catch (err) {
      console.error('Create table exception:', err)
      setError(`Create table failed: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const fixMissingColumns = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Add missing columns if they don't exist
      const addColumnsSQL = `
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'cost_of_acquisition') THEN
            ALTER TABLE settings ADD COLUMN cost_of_acquisition DECIMAL(10,2) NOT NULL DEFAULT 50.00;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'gross_profit_margin') THEN
            ALTER TABLE settings ADD COLUMN gross_profit_margin DECIMAL(5,2) NOT NULL DEFAULT 30.00;
          END IF;
        END $$;
      `
      
      const { data, error } = await supabase.rpc('exec_sql', { sql: addColumnsSQL })
      
      if (error) {
        console.error('Add columns error:', error)
        setError(`Add columns error: ${error.message}`)
      } else {
        console.log('Columns added successfully')
        await checkTableExists()
        await loadSettings()
      }
      
    } catch (err) {
      console.error('Add columns exception:', err)
      setError(`Add columns failed: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkTableExists()
    loadSettings()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings Debug Page</h1>
      
      <div className="space-y-6">
        {/* Table Status */}
        <Card>
          <CardHeader>
            <CardTitle>Database Table Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Table exists: {tableExists === null ? 'Checking...' : tableExists ? 'Yes' : 'No'}</p>
            {!tableExists && (
              <Button onClick={createTable} disabled={loading} className="mt-2">
                Create Settings Table
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-red-600 whitespace-pre-wrap">{error}</pre>
            </CardContent>
          </Card>
        )}

        {/* Raw Data */}
        <Card>
          <CardHeader>
            <CardTitle>Raw Database Query Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(rawData, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Processed Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Processed Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(settings, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-x-4 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button onClick={loadSettings} disabled={loading}>
                Reload Settings
              </Button>
              <Button onClick={testSaveSettings} disabled={loading}>
                Test Save Settings
              </Button>
              <Button onClick={checkTableExists} disabled={loading}>
                Check Table
              </Button>
              <Button onClick={fixMissingColumns} disabled={loading} variant="outline">
                Fix Missing Columns
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SettingsDebugPage