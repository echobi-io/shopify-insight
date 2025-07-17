import { getSettings, AppSettings } from '@/lib/fetchers/getSettingsData'

// Cache for settings to avoid repeated database calls
let settingsCache: AppSettings | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const MERCHANT_ID = '11111111-1111-1111-1111-111111111111'

/**
 * Get cached settings or fetch from database
 */
async function getCachedSettings(): Promise<AppSettings> {
  const now = Date.now()
  
  // Return cached settings if still valid
  if (settingsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return settingsCache
  }

  try {
    // Fetch fresh settings
    const settings = await getSettings(MERCHANT_ID)
    settingsCache = settings
    cacheTimestamp = now
    return settings
  } catch (error) {
    console.error('Error fetching settings for currency:', error)
    // Return cached settings if available, otherwise defaults
    return settingsCache || {
      merchant_id: MERCHANT_ID,
      financialYearStart: '01-01',
      financialYearEnd: '12-31',
      defaultDateRange: 'financial_current',
      timezone: 'UTC',
      currency: 'USD',
      churnPeriodDays: 180,
      costOfAcquisition: 50,
      grossProfitMargin: 30
    }
  }
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$',
    JPY: '¥',
    CHF: 'CHF',
    CNY: '¥',
    INR: '₹',
    BRL: 'R$',
    MXN: '$',
    KRW: '₩',
    SGD: 'S$',
    HKD: 'HK$',
    NOK: 'kr',
    SEK: 'kr',
    DKK: 'kr',
    PLN: 'zł',
    CZK: 'Kč',
    HUF: 'Ft',
    RUB: '₽',
    TRY: '₺',
    ZAR: 'R',
    NZD: 'NZ$'
  }
  return symbols[currency] || currency
}

/**
 * Format currency value using user's settings (async version)
 */
export async function formatCurrencyAsync(
  value: number | null | undefined,
  overrideCurrency?: string
): Promise<string> {
  // Handle null/undefined/invalid values
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    const settings = await getCachedSettings()
    const currency = overrideCurrency || settings.currency
    const symbol = getCurrencySymbol(currency)
    return `${symbol}0`
  }

  try {
    const settings = await getCachedSettings()
    const currency = overrideCurrency || settings.currency
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  } catch (error) {
    console.error('Error formatting currency:', error)
    const currency = overrideCurrency || 'USD'
    const symbol = getCurrencySymbol(currency)
    return `${symbol}${Math.round(value).toLocaleString()}`
  }
}

/**
 * Format currency value using cached settings (sync version)
 * Falls back to USD if no settings are cached
 */
export function formatCurrency(
  value: number | null | undefined,
  overrideCurrency?: string
): string {
  // Handle null/undefined/invalid values
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    const currency = overrideCurrency || settingsCache?.currency || 'USD'
    const symbol = getCurrencySymbol(currency)
    return `${symbol}0`
  }

  try {
    const currency = overrideCurrency || settingsCache?.currency || 'USD'
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  } catch (error) {
    console.error('Error formatting currency:', error)
    const currency = overrideCurrency || 'USD'
    const symbol = getCurrencySymbol(currency)
    return `${symbol}${Math.round(value).toLocaleString()}`
  }
}

/**
 * Format currency with decimal places
 */
export function formatCurrencyWithDecimals(
  value: number | null | undefined,
  decimals: number = 2,
  overrideCurrency?: string
): string {
  // Handle null/undefined/invalid values
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    const currency = overrideCurrency || settingsCache?.currency || 'USD'
    const symbol = getCurrencySymbol(currency)
    return `${symbol}0.${'0'.repeat(decimals)}`
  }

  try {
    const currency = overrideCurrency || settingsCache?.currency || 'USD'
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  } catch (error) {
    console.error('Error formatting currency with decimals:', error)
    const currency = overrideCurrency || 'USD'
    const symbol = getCurrencySymbol(currency)
    return `${symbol}${value.toFixed(decimals)}`
  }
}

/**
 * Format compact currency (e.g., $1.2K, $1.5M)
 */
export function formatCompactCurrency(
  value: number | null | undefined,
  overrideCurrency?: string
): string {
  // Handle null/undefined/invalid values
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    const currency = overrideCurrency || settingsCache?.currency || 'USD'
    const symbol = getCurrencySymbol(currency)
    return `${symbol}0`
  }

  const currency = overrideCurrency || settingsCache?.currency || 'USD'
  const symbol = getCurrencySymbol(currency)
  
  if (Math.abs(value) >= 1000000) {
    return `${symbol}${(value / 1000000).toFixed(1)}M`
  }
  if (Math.abs(value) >= 1000) {
    return `${symbol}${(value / 1000).toFixed(1)}K`
  }
  
  return formatCurrency(value, currency)
}

/**
 * Initialize currency settings cache
 * Call this early in the application lifecycle
 */
export async function initializeCurrencySettings(): Promise<void> {
  try {
    await getCachedSettings()
  } catch (error) {
    console.error('Failed to initialize currency settings:', error)
  }
}

/**
 * Clear the settings cache (call when settings are updated)
 */
export function clearCurrencyCache(): void {
  settingsCache = null
  cacheTimestamp = 0
}

/**
 * Get current currency code from settings
 */
export function getCurrentCurrency(): string {
  return settingsCache?.currency || 'USD'
}

/**
 * Check if a value should be formatted as currency based on field name
 */
export function isCurrencyField(fieldName: string): boolean {
  const currencyFields = [
    'revenue', 'total_revenue', 'totalRevenue',
    'value', 'total_value', 'totalValue',
    'aov', 'avg_order_value', 'avgOrderValue', 'average_order_value',
    'spent', 'total_spent', 'totalSpent',
    'price', 'amount', 'cost', 'fee',
    'refund', 'refunds', 'total_refunds',
    'profit', 'margin', 'earnings',
    'ltv', 'lifetime_value', 'lifetimeValue',
    'acquisition_cost', 'acquisitionCost', 'cac'
  ]
  
  const lowerFieldName = fieldName.toLowerCase()
  return currencyFields.some(field => lowerFieldName.includes(field))
}