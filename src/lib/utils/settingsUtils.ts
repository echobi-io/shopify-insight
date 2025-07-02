export interface AppSettings {
  financialYearStart: string
  financialYearEnd: string
  defaultDateRange: string
  timezone: string
  currency: string
  churnPeriodDays: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  financialYearStart: '01-01', // MM-DD format
  financialYearEnd: '12-31',   // MM-DD format
  defaultDateRange: '2023',
  timezone: 'UTC',
  currency: 'USD',
  churnPeriodDays: 180 // Default: 180 days without purchase = churned
}

export function getSettings(): AppSettings {
  try {
    const savedSettings = localStorage.getItem('echobi-settings')
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
  return DEFAULT_SETTINGS
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
  const settings = getSettings()
  const currencyCode = currency || settings.currency
  const symbol = getCurrencySymbol(currencyCode)
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    currencyDisplay: 'symbol'
  }).format(value).replace(/[A-Z]{3}/, symbol)
}

export function getFinancialYearDates(year: number): { startDate: Date; endDate: Date } {
  const settings = getSettings()
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

export function getInitialTimeframe(): string {
  const settings = getSettings()
  return settings.defaultDateRange
}