export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export function getDateRangeFromTimeframe(timeframe: string): DateRange {
  const endDate = new Date();
  const startDate = new Date();

  switch (timeframe) {
    case 'Last 7 days':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'Last 30 days':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case 'Last 90 days':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case 'Last 6 months':
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case 'Last year':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case 'This month':
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'This year':
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      // Default to last 30 days
      startDate.setDate(endDate.getDate() - 30);
  }

  return { startDate, endDate };
}

export function formatDateForSQL(date: Date): string {
  return date.toISOString();
}

export function getPreviousDateRange(timeframe: string): DateRange {
  const currentRange = getDateRangeFromTimeframe(timeframe);
  const duration = currentRange.endDate.getTime() - currentRange.startDate.getTime();
  
  const endDate = new Date(currentRange.startDate);
  const startDate = new Date(currentRange.startDate.getTime() - duration);
  
  return { startDate, endDate };
}