import { getSettings as getSettingsFromDB, AppSettings, DEFAULT_SETTINGS, getCurrencySymbol as getCurrencySymbolFromDB } from '../fetchers/getSettingsData'

// Re-export types and constants
export type { AppSettings }
export { DEFAULT_SETTINGS }

const MERCHANT_ID = '11111111-1111-1111-1111-111111111111'

// Cache for settings to avoid repeated database calls
let settingsCache: AppSettings | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getSettings(): Promise<AppSettings> {
  try {
    // Check if we have valid cached settings
    const now = Date.now()
    if (settingsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return settingsCache
    }

    // Fetch from database
    const settings = await getSettingsFromDB(MERCHANT_ID)
    
    // Update cache
    settingsCache = settings
    cacheTimestamp = now
    
    return settings
  } catch (error) {
    console.error('Error loading settings:', error)
    return {
      ...DEFAULT_SETTINGS,
      merchant_id: MERCHANT_ID
    }
  }
}

// Synchronous version that returns cached settings or defaults
export function getSettingsSync(): AppSettings {
  if (settingsCache) {
    return settingsCache
  }
  
  // Try to get from localStorage as fallback
  try {
    const savedSettings = localStorage.getItem('echobi-settings')
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      return { ...DEFAULT_SETTINGS, merchant_id: MERCHANT_ID, ...parsed }
    }
  } catch (error) {
    console.error('Error loading settings from localStorage:', error)
  }
  
  return {
    ...DEFAULT_SETTINGS,
    merchant_id: MERCHANT_ID
  }
}

export function getCurrencySymbol(currency: string): string {
  return getCurrencySymbolFromDB(currency)
}

export function formatCurrency(value: number, currency?: string): string {
  const settings = getSettingsSync()
  const currencyCode = currency || settings.currency
  const symbol = getCurrencySymbol(currencyCode)
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    currencyDisplay: 'symbol'
  }).format(value).replace(/[A-Z]{3}/, symbol)
}

export function getFinancialYearDates(year: number, settings?: AppSettings): { startDate: Date; endDate: Date } {
  const appSettings = settings || getSettingsSync()
  const [startMonth, startDay] = appSettings.financialYearStart.split('-').map(Number)
  const [endMonth, endDay] = appSettings.financialYearEnd.split('-').map(Number)
  
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

export function getInitialTimeframe(): string {
  const settings = getSettingsSync()
  return settings.defaultDateRange
}

// Clear cache when settings are updated
export function clearSettingsCache(): void {
  settingsCache = null
  cacheTimestamp = 0
}