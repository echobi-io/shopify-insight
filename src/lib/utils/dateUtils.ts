import { getSettings, getFinancialYearDates } from './settingsUtils'

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export function getDateRangeFromTimeframe(timeframe: string, customStartDate?: string, customEndDate?: string): DateRange {
  const endDate = new Date();
  const startDate = new Date();

  // Handle undefined or null timeframe
  if (!timeframe) {
    const currentYear = new Date().getFullYear();
    const financialYear = getFinancialYearDates(currentYear);
    return { 
      startDate: new Date(financialYear.startDate), 
      endDate: new Date(financialYear.endDate) 
    };
  }

  // Handle custom date ranges
  if (timeframe.startsWith('custom_')) {
    const parts = timeframe.split('_');
    if (parts.length === 3) {
      const customStartDate = new Date(parts[1]);
      const customEndDate = new Date(parts[2]);
      
      customStartDate.setHours(0, 0, 0, 0);
      customEndDate.setHours(23, 59, 59, 999);
      
      return { startDate: customStartDate, endDate: customEndDate };
    }
  }

  // Handle custom range with provided dates
  if (timeframe === 'custom' && customStartDate && customEndDate) {
    const start = new Date(customStartDate);
    const end = new Date(customEndDate);
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    return { startDate: start, endDate: end };
  }

  switch (timeframe) {
    case 'today':
      // Today only
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    case 'yesterday':
      // Yesterday only
      startDate.setDate(endDate.getDate() - 1);
      endDate.setDate(endDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    case 'last7days':
    case 'last_7_days':
    case 'Last 7 days':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'last30days':
    case 'last_30_days':
    case 'Last 30 days':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case 'last90days':
    case 'last_90_days':
    case 'Last 90 days':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case 'last6months':
    case 'last_6_months':
    case 'Last 6 months':
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case 'lastYear':
    case 'last_year':
    case 'Last year':
      // Set to exactly 365 days ago to ensure we get a full year of data
      startDate.setDate(endDate.getDate() - 365);
      break;
    case 'thisMonth':
    case 'this_month':
    case 'This month':
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'lastMonth':
    case 'last_month':
    case 'Last month':
      // Set to first day of last month
      startDate.setMonth(endDate.getMonth() - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      // Set end date to last day of last month
      endDate.setDate(0); // This sets to last day of previous month
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    case 'thisYear':
    case 'this_year':
    case 'This year':
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'calendar_2024':
    case 'all_2024':
      startDate.setFullYear(2024, 0, 1); // January 1, 2024
      endDate.setFullYear(2024, 11, 31); // December 31, 2024
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    case 'calendar_2023':
    case 'all_2023':
      startDate.setFullYear(2023, 0, 1); // January 1, 2023
      endDate.setFullYear(2023, 11, 31); // December 31, 2023
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    case 'financial_current': {
      const currentYear = new Date().getFullYear();
      const financialYear = getFinancialYearDates(currentYear);
      
      return { 
        startDate: new Date(financialYear.startDate), 
        endDate: new Date(financialYear.endDate) 
      };
    }
    case 'financial_previous': {
      const currentYear = new Date().getFullYear();
      const financialYear = getFinancialYearDates(currentYear - 1);
      return { 
        startDate: new Date(financialYear.startDate), 
        endDate: new Date(financialYear.endDate) 
      };
    }
    case 'daily':
      startDate.setDate(endDate.getDate() - 14); // Last 14 days for daily view
      break;
    case 'weekly':
      startDate.setDate(endDate.getDate() - 28); // Last 4 weeks for weekly view
      break;
    case 'monthly':
      startDate.setMonth(endDate.getMonth() - 6); // Last 6 months for monthly view
      break;
    default:
      const currentYear = new Date().getFullYear();
      const financialYear = getFinancialYearDates(currentYear);
      return { 
        startDate: new Date(financialYear.startDate), 
        endDate: new Date(financialYear.endDate) 
      };
  }

  // Ensure start date is at beginning of day and end date is at end of day
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

export function formatDateForSQL(date: Date): string {
  return date.toISOString();
}

export function getPreviousDateRange(timeframe: string): DateRange {
  // Handle undefined or null timeframe
  if (!timeframe) {
    timeframe = 'financial_current'; // Default fallback
  }
  
  const currentRange = getDateRangeFromTimeframe(timeframe);
  const duration = currentRange.endDate.getTime() - currentRange.startDate.getTime();
  
  const endDate = new Date(currentRange.startDate);
  const startDate = new Date(currentRange.startDate.getTime() - duration);
  
  return { startDate, endDate };
}