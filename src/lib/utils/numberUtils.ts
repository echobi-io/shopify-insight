/**
 * Utility functions for handling numbers and percentages safely
 */

export function safePercentage(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return '0.0%';
  }
  
  return `${value.toFixed(decimals)}%`;
}

export function safeNumber(value: number | null | undefined, fallback: number = 0): number {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return fallback;
  }
  
  return value;
}

export function safeCalculatePercentage(
  current: number | null | undefined, 
  previous: number | null | undefined,
  decimals: number = 1
): string {
  const currentSafe = safeNumber(current);
  const previousSafe = safeNumber(previous);
  
  if (previousSafe === 0) {
    return currentSafe > 0 ? '+∞%' : '0.0%';
  }
  
  const percentage = ((currentSafe - previousSafe) / previousSafe) * 100;
  return safePercentage(percentage, decimals);
}

export function safeCalculateChange(
  current: number | null | undefined, 
  previous: number | null | undefined
): number {
  const currentSafe = safeNumber(current);
  const previousSafe = safeNumber(previous);
  
  if (previousSafe === 0) {
    return currentSafe > 0 ? Infinity : 0;
  }
  
  const change = ((currentSafe - previousSafe) / previousSafe) * 100;
  return safeNumber(change);
}

export function formatCurrency(
  value: number | null | undefined, 
  currency: string = 'USD',
  fallback: string = '£0'
): string {
  const safeCurrency = currency === 'GBP' ? 'GBP' : 'USD';
  const safeValue = safeNumber(value);
  
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    return formatter.format(safeValue);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return fallback;
  }
}

export function formatNumber(
  value: number | null | undefined,
  options: {
    decimals?: number;
    fallback?: string;
    useGrouping?: boolean;
  } = {}
): string {
  const { decimals = 0, fallback = '0', useGrouping = true } = options;
  const safeValue = safeNumber(value);
  
  try {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping
    }).format(safeValue);
  } catch (error) {
    console.error('Error formatting number:', error);
    return fallback;
  }
}

export function formatCompactNumber(value: number | null | undefined): string {
  const safeValue = safeNumber(value);
  
  if (safeValue >= 1000000) {
    return `${(safeValue / 1000000).toFixed(1)}M`;
  }
  if (safeValue >= 1000) {
    return `${(safeValue / 1000).toFixed(1)}K`;
  }
  
  return formatNumber(safeValue);
}

export function isValidNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

export function safeGrowthRate(current: number | null | undefined, previous: number | null | undefined): {
  value: number;
  display: string;
  isValid: boolean;
} {
  const currentSafe = safeNumber(current);
  const previousSafe = safeNumber(previous);
  
  if (previousSafe === 0) {
    return {
      value: currentSafe > 0 ? Infinity : 0,
      display: currentSafe > 0 ? '+∞%' : '0.0%',
      isValid: false
    };
  }
  
  const growthRate = ((currentSafe - previousSafe) / previousSafe) * 100;
  
  if (!isValidNumber(growthRate)) {
    return {
      value: 0,
      display: '0.0%',
      isValid: false
    };
  }
  
  return {
    value: growthRate,
    display: safePercentage(growthRate),
    isValid: true
  };
}