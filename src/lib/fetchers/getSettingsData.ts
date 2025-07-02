import { supabase } from '../supabaseClient'

export interface AppSettings {
  id?: string
  merchant_id: string
  financialYearStart: string
  financialYearEnd: string
  defaultDateRange: string
  timezone: string
  currency: string
  churnPeriodDays: number
  created_at?: string
  updated_at?: string
}

export const DEFAULT_SETTINGS: Omit<AppSettings, 'id' | 'merchant_id' | 'created_at' | 'updated_at'> = {
  financialYearStart: '01-01', // MM-DD format
  financialYearEnd: '12-31',   // MM-DD format
  defaultDateRange: 'financial_current',
  timezone: 'UTC',
  currency: 'USD',
  churnPeriodDays: 180 // Default: 180 days without purchase = churned
}

export async function getSettings(merchant_id: string): Promise<AppSettings> {
  try {
    console.log('📋 Fetching settings for merchant:', merchant_id)

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('merchant_id', merchant_id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, return defaults
        console.log('📋 No settings found, returning defaults')
        return {
          ...DEFAULT_SETTINGS,
          merchant_id
        }
      }
      console.error('❌ Error fetching settings:', error)
      return {
        ...DEFAULT_SETTINGS,
        merchant_id
      }
    }

    console.log('✅ Settings loaded successfully')
    return data

  } catch (error) {
    console.error('❌ Error fetching settings:', error)
    return {
      ...DEFAULT_SETTINGS,
      merchant_id
    }
  }
}

export async function saveSettings(settings: AppSettings): Promise<boolean> {
  try {
    console.log('💾 Saving settings for merchant:', settings.merchant_id)

    const settingsData = {
      merchant_id: settings.merchant_id,
      financialYearStart: settings.financialYearStart,
      financialYearEnd: settings.financialYearEnd,
      defaultDateRange: settings.defaultDateRange,
      timezone: settings.timezone,
      currency: settings.currency,
      churnPeriodDays: settings.churnPeriodDays,
      updated_at: new Date().toISOString()
    }

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