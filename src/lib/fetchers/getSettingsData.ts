import { supabase } from '../supabaseClient'

export interface AppSettings {
  id?: string
  shop_id: string
  financialYearStart: string
  financialYearEnd: string
  defaultDateRange: string
  timezone: string
  currency: string
  churnPeriodDays: number
  costOfAcquisition: number
  grossProfitMargin: number
  created_at?: string
  updated_at?: string
}

export const DEFAULT_SETTINGS: Omit<AppSettings, 'id' | 'shop_id' | 'created_at' | 'updated_at'> = {
  financialYearStart: '01-01', // MM-DD format
  financialYearEnd: '12-31',   // MM-DD format
  defaultDateRange: 'financial_current',
  timezone: 'UTC',
  currency: 'USD',
  churnPeriodDays: 180, // Default: 180 days without purchase = churned
  costOfAcquisition: 50, // Default: $50 per customer
  grossProfitMargin: 30 // Default: 30% gross profit margin
}

export async function getSettings(shop_id: string): Promise<AppSettings> {
  try {
    console.log('📋 Fetching settings for shop:', shop_id)

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('merchant_id', shop_id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, return defaults
        console.log('📋 No settings found, returning defaults')
        return {
          ...DEFAULT_SETTINGS,
          shop_id
        }
      }
      console.error('❌ Error fetching settings:', error)
      return {
        ...DEFAULT_SETTINGS,
        shop_id
      }
    }

    console.log('✅ Settings loaded successfully:', data)
    
    // Map database snake_case to camelCase interface
    const mappedSettings: AppSettings = {
      id: data.id,
      shop_id: data.merchant_id, // Database still uses merchant_id but we map it to shop_id
      financialYearStart: data.financial_year_start || DEFAULT_SETTINGS.financialYearStart,
      financialYearEnd: data.financial_year_end || DEFAULT_SETTINGS.financialYearEnd,
      defaultDateRange: data.default_date_range || DEFAULT_SETTINGS.defaultDateRange,
      timezone: data.timezone || DEFAULT_SETTINGS.timezone,
      currency: data.currency || DEFAULT_SETTINGS.currency,
      churnPeriodDays: data.churn_period_days || DEFAULT_SETTINGS.churnPeriodDays,
      costOfAcquisition: data.cost_of_acquisition || DEFAULT_SETTINGS.costOfAcquisition,
      grossProfitMargin: data.gross_profit_margin || DEFAULT_SETTINGS.grossProfitMargin,
      created_at: data.created_at,
      updated_at: data.updated_at
    }

    return mappedSettings

  } catch (error) {
    console.error('❌ Error fetching settings:', error)
    return {
      ...DEFAULT_SETTINGS,
      shop_id
    }
  }
}

export async function saveSettings(settings: AppSettings): Promise<boolean> {
  try {
    console.log('💾 Saving settings for shop:', settings.shop_id)

    // Map camelCase interface to database snake_case
    const settingsData = {
      merchant_id: settings.shop_id, // Map shop_id back to merchant_id for database
      financial_year_start: settings.financialYearStart,
      financial_year_end: settings.financialYearEnd,
      default_date_range: settings.defaultDateRange,
      timezone: settings.timezone,
      currency: settings.currency,
      churn_period_days: settings.churnPeriodDays,
      cost_of_acquisition: settings.costOfAcquisition,
      gross_profit_margin: settings.grossProfitMargin,
      updated_at: new Date().toISOString()
    }

    console.log('💾 Mapped settings data:', settingsData)

    const { error } = await supabase
      .from('settings')
      .upsert(settingsData, {
        onConflict: 'merchant_id'
      })

    if (error) {
      console.error('❌ Error saving settings:', error)
      return false
    }

    console.log('✅ Settings saved successfully')
    return true

  } catch (error) {
    console.error('❌ Error saving settings:', error)
    return false
  }
}

export function clearSettingsCache(): void {
  // This function will be implemented in settingsUtils.ts
  // It's here for backward compatibility
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$'
  }
  return symbols[currency] || '$'
}

export function formatCurrency(value: number, currency?: string): string {
  const currencyCode = currency || 'USD'
  const symbol = getCurrencySymbol(currencyCode)
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    currencyDisplay: 'symbol'
  }).format(value).replace(/[A-Z]{3}/, symbol)
}

export function getFinancialYearDates(year: number, settings: AppSettings): { startDate: Date; endDate: Date } {
  const [startMonth, startDay] = settings.financialYearStart.split('-').map(Number)
  const [endMonth, endDay] = settings.financialYearEnd.split('-').map(Number)
  
  let startYear = year
  let endYear = year
  
  // If financial year crosses calendar year boundary
  if (startMonth > endMonth || (startMonth === endMonth && startDay > endDay)) {
    endYear = year + 1
  }
  
  const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0)
  const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999)
  
  return { startDate, endDate }
}

export function getPreviousYearDateRange(currentStartDate: Date, currentEndDate: Date): { startDate: Date; endDate: Date } {
  const duration = currentEndDate.getTime() - currentStartDate.getTime()
  const previousEndDate = new Date(currentStartDate.getTime() - 1) // One day before current start
  const previousStartDate = new Date(previousEndDate.getTime() - duration)
  
  return { 
    startDate: previousStartDate, 
    endDate: previousEndDate 
  }
}