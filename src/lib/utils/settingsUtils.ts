import { getSettings as getSettingsFromDB, AppSettings, DEFAULT_SETTINGS, getCurrencySymbol as getCurrencySymbolFromDB } from '../fetchers/getSettingsData'

// Re-export types and constants
export type { AppSettings }
export { DEFAULT_SETTINGS }

// Cache for settings to avoid repeated database calls - now shop-specific
const settingsCache = new Map<string, { settings: AppSettings; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getSettings(shopId?: string): Promise<AppSettings> {
  try {
    if (!shopId) {
      console.warn('No shop ID provided for settings, using defaults')
      return DEFAULT_SETTINGS
    }

    // Check if we have valid cached settings for this shop
    const now = Date.now()
    const cached = settingsCache.get(shopId)
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return cached.settings
    }

    // Fetch from database
    const settings = await getSettingsFromDB(shopId)
    
    // Update cache
    settingsCache.set(shopId, {
      settings,
      timestamp: now
    })
    
    return settings
  } catch (error) {
    console.error('Error loading settings:', error)
    return {
      ...DEFAULT_SETTINGS,
      shop_id: shopId
    }
  }
}

// Synchronous version that returns cached settings or defaults
export function getSettingsSync(shopId?: string): AppSettings {
  if (shopId) {
    const cached = settingsCache.get(shopId)
    if (cached) {
      return cached.settings
    }
  }
  
  // Try to get from localStorage as fallback
  try {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('echobi-settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        return { ...DEFAULT_SETTINGS, shop_id: shopId, ...parsed }
      }
    }
  } catch (error) {
    console.error('Error loading settings from localStorage:', error)
  }
  
  return {
    ...DEFAULT_SETTINGS,
    shop_id: shopId
  }
}

// Import unified currency utilities
import { 
  formatCurrency as formatCurrencyUnified, 
  getCurrencySymbol as getCurrencySymbolUnified,
  clearCurrencyCache
} from './currencyUtils'

export function getCurrencySymbol(currency: string): string {
  return getCurrencySymbolUnified(currency)
}

export function formatCurrency(value: number, currency?: string): string {
  return formatCurrencyUnified(value, currency)
}

export function getFinancialYearDates(year: number, settings?: AppSettings): { startDate: Date; endDate: Date } {
  const appSettings = settings || getSettingsSync()
  
  // Provide fallback values if financialYearStart or financialYearEnd are undefined
  const financialYearStart = appSettings?.financialYearStart || DEFAULT_SETTINGS.financialYearStart
  const financialYearEnd = appSettings?.financialYearEnd || DEFAULT_SETTINGS.financialYearEnd
  
  // Ensure we have valid strings before splitting
  if (!financialYearStart || !financialYearEnd || 
      typeof financialYearStart !== 'string' || typeof financialYearEnd !== 'string') {
    // Return calendar year as fallback
    return {
      startDate: new Date(year, 0, 1, 0, 0, 0, 0), // January 1st
      endDate: new Date(year, 11, 31, 23, 59, 59, 999) // December 31st
    }
  }
  
  const startParts = financialYearStart.split('-')
  const endParts = financialYearEnd.split('-')
  
  if (startParts.length !== 2 || endParts.length !== 2) {
    // Return calendar year as fallback
    return {
      startDate: new Date(year, 0, 1, 0, 0, 0, 0), // January 1st
      endDate: new Date(year, 11, 31, 23, 59, 59, 999) // December 31st
    }
  }
  
  const [startMonth, startDay] = startParts.map(Number)
  const [endMonth, endDay] = endParts.map(Number)
  
  // Validate the parsed numbers
  if (isNaN(startMonth) || isNaN(startDay) || isNaN(endMonth) || isNaN(endDay) ||
      startMonth < 1 || startMonth > 12 || endMonth < 1 || endMonth > 12 ||
      startDay < 1 || startDay > 31 || endDay < 1 || endDay > 31) {
    // Return calendar year as fallback
    return {
      startDate: new Date(year, 0, 1, 0, 0, 0, 0), // January 1st
      endDate: new Date(year, 11, 31, 23, 59, 59, 999) // December 31st
    }
  }
  
  let startYear = year
  let endYear = year
  
  // If financial year crosses calendar year boundary (e.g., April to March)
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
  return settings.defaultDateRange || DEFAULT_SETTINGS.defaultDateRange
}

// Clear cache when settings are updated
export function clearSettingsCache(shopId?: string): void {
  if (shopId) {
    settingsCache.delete(shopId)
  } else {
    settingsCache.clear()
  }
}