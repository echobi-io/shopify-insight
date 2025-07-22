/**
 * Chart Date Utilities
 * 
 * This module provides utilities for formatting dates specifically for chart components
 * to prevent moment.js deprecation warnings and ensure consistent date handling.
 */

/**
 * Validates and formats a date string to ensure it's in a proper format
 * Prevents moment.js deprecation warnings by ensuring dates are in RFC2822 or ISO format
 */
export function sanitizeDateForChart(dateValue: any): string {
  if (!dateValue) {
    return new Date().toISOString().split('T')[0]
  }

  // If it's already a Date object
  if (dateValue instanceof Date) {
    if (isNaN(dateValue.getTime())) {
      console.warn('Invalid Date object provided to chart:', dateValue)
      return new Date().toISOString().split('T')[0]
    }
    return dateValue.toISOString().split('T')[0]
  }

  // If it's a string
  if (typeof dateValue === 'string') {
    // Handle common problematic formats
    let cleanedDate = dateValue.trim()
    
    // If it's just 'Z' or ends with 'Z' but is malformed
    if (cleanedDate === 'Z' || (cleanedDate.endsWith('Z') && cleanedDate.length < 10)) {
      console.warn('Invalid date string provided to chart:', dateValue)
      return new Date().toISOString().split('T')[0]
    }

    // Try to parse the date
    const parsedDate = new Date(cleanedDate)
    if (isNaN(parsedDate.getTime())) {
      console.warn('Unable to parse date string for chart:', dateValue)
      return new Date().toISOString().split('T')[0]
    }

    // Return in YYYY-MM-DD format for consistency
    return parsedDate.toISOString().split('T')[0]
  }

  // For any other type, convert to string and try again
  console.warn('Unexpected date type provided to chart:', typeof dateValue, dateValue)
  return new Date().toISOString().split('T')[0]
}

/**
 * Formats a date for display in charts based on granularity
 */
export function formatChartDateLabel(dateValue: any, granularity: string = 'daily'): string {
  const sanitizedDate = sanitizeDateForChart(dateValue)
  
  try {
    const date = new Date(sanitizedDate)
    
    switch (granularity) {
      case 'daily':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      case 'weekly':
        if (typeof dateValue === 'string' && dateValue.startsWith('Week of ')) {
          return dateValue.replace('Week of ', '')
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      case 'monthly':
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      case 'quarterly':
        const quarter = Math.floor(date.getMonth() / 3) + 1
        return `Q${quarter} ${date.getFullYear().toString().slice(-2)}`
      case 'yearly':
        return date.getFullYear().toString()
      default:
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  } catch (error) {
    console.warn('Error formatting chart date label:', error, dateValue)
    return String(dateValue)
  }
}

/**
 * Formats a date for tooltip display in charts
 */
export function formatChartTooltipLabel(dateValue: any, granularity: string = 'daily'): string {
  const sanitizedDate = sanitizeDateForChart(dateValue)
  
  try {
    const date = new Date(sanitizedDate)
    
    switch (granularity) {
      case 'daily':
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      case 'weekly':
        if (typeof dateValue === 'string' && dateValue.startsWith('Week of ')) {
          return dateValue
        }
        return `Week of ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
      case 'monthly':
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      case 'quarterly':
        const quarter = Math.floor(date.getMonth() / 3) + 1
        return `Q${quarter} ${date.getFullYear()}`
      case 'yearly':
        return date.getFullYear().toString()
      default:
        return date.toLocaleDateString()
    }
  } catch (error) {
    console.warn('Error formatting chart tooltip label:', error, dateValue)
    return String(dateValue)
  }
}

/**
 * Sanitizes chart data to ensure all date fields are properly formatted
 */
export function sanitizeChartData<T extends Record<string, any>>(
  data: T[], 
  dateKey: string = 'date'
): T[] {
  if (!Array.isArray(data)) {
    console.warn('Invalid data provided to sanitizeChartData:', data)
    return []
  }

  return data.map((item, index) => {
    if (!item || typeof item !== 'object') {
      console.warn(`Invalid data item at index ${index}:`, item)
      return item
    }

    const sanitizedItem = { ...item }
    
    if (dateKey in sanitizedItem) {
      sanitizedItem[dateKey] = sanitizeDateForChart(sanitizedItem[dateKey])
    }

    return sanitizedItem
  })
}

/**
 * Creates a safe date range for chart data
 */
export function createSafeDateRange(startDate: any, endDate: any): { startDate: string; endDate: string } {
  return {
    startDate: sanitizeDateForChart(startDate),
    endDate: sanitizeDateForChart(endDate)
  }
}