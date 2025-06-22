export function getDateRange(timeRange: string): { startDate: string; endDate: string } {
  const now = new Date()
  const endDate = now.toISOString()
  let startDate: string

  switch (timeRange) {
    case 'daily':
      // Last 14 days
      const fourteenDaysAgo = new Date(now)
      fourteenDaysAgo.setDate(now.getDate() - 14)
      startDate = fourteenDaysAgo.toISOString()
      break
    
    case 'weekly':
      // Last 4 weeks (28 days)
      const fourWeeksAgo = new Date(now)
      fourWeeksAgo.setDate(now.getDate() - 28)
      startDate = fourWeeksAgo.toISOString()
      break
    
    case 'monthly':
    default:
      // Last 6 months
      const sixMonthsAgo = new Date(now)
      sixMonthsAgo.setMonth(now.getMonth() - 6)
      startDate = sixMonthsAgo.toISOString()
      break
  }

  return { startDate, endDate }
}

export function parseFiltersFromUrl(query: any): {
  segment?: string
  channel?: string
  product?: string
  dateRange?: string
} {
  return {
    segment: query.segment as string,
    channel: query.channel as string,
    product: query.product as string,
    dateRange: query.date_range as string
  }
}

export function buildFilterState(timeRange: string, selectedSegment: string, urlFilters: any) {
  const { startDate, endDate } = getDateRange(timeRange)
  
  return {
    startDate,
    endDate,
    segment: urlFilters.segment || selectedSegment,
    channel: urlFilters.channel,
    product: urlFilters.product
  }
}