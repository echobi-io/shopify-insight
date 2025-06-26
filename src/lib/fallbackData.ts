// Fallback/Demo data for when Supabase data is not available
// This ensures the app always has working data to display

export const fallbackKpiData = {
  totalRevenue: 67000,
  totalOrders: 480,
  avgOrderValue: 139.58,
  percentOrdering: 87.5,
  newCustomers: 142,
  churnRisk: 17.2
};

export const fallbackSalesKpiData = {
  totalRevenue: 67000,
  totalOrders: 480,
  avgOrderValue: 139.58,
  refundRate: 2.1,
  repeatOrderRate: 68.5
};

export const fallbackDailyTrendData = [
  { date: '2024-06-01', revenue: 2100, orders: 15, customers: 12, orderingRate: 8.2 },
  { date: '2024-06-02', revenue: 2350, orders: 18, customers: 14, orderingRate: 9.1 },
  { date: '2024-06-03', revenue: 1980, orders: 12, customers: 10, orderingRate: 7.8 },
  { date: '2024-06-04', revenue: 2800, orders: 22, customers: 18, orderingRate: 11.2 },
  { date: '2024-06-05', revenue: 2650, orders: 19, customers: 16, orderingRate: 10.1 },
  { date: '2024-06-06', revenue: 3100, orders: 25, customers: 21, orderingRate: 12.8 },
  { date: '2024-06-07', revenue: 2900, orders: 21, customers: 17, orderingRate: 11.5 },
  { date: '2024-06-08', revenue: 2400, orders: 16, customers: 13, orderingRate: 8.9 },
  { date: '2024-06-09', revenue: 2750, orders: 20, customers: 16, orderingRate: 10.8 },
  { date: '2024-06-10', revenue: 3200, orders: 26, customers: 22, orderingRate: 13.1 },
  { date: '2024-06-11', revenue: 2850, orders: 21, customers: 18, orderingRate: 11.3 },
  { date: '2024-06-12', revenue: 2600, orders: 18, customers: 15, orderingRate: 9.7 },
  { date: '2024-06-13', revenue: 3400, orders: 28, customers: 24, orderingRate: 14.2 },
  { date: '2024-06-14', revenue: 3100, orders: 24, customers: 20, orderingRate: 12.6 },
];

export const fallbackWeeklyTrendData = [
  { week: 'Week 1', revenue: 15200, orders: 102, customers: 85, orderingRate: 9.2 },
  { week: 'Week 2', revenue: 18400, orders: 128, customers: 106, orderingRate: 10.8 },
  { week: 'Week 3', revenue: 21600, orders: 145, customers: 118, orderingRate: 11.9 },
  { week: 'Week 4', revenue: 19800, orders: 135, customers: 112, orderingRate: 11.2 },
];

export const fallbackMonthlyTrendData = [
  { month: 'Jan', revenue: 45000, orders: 320, customers: 280, orderingRate: 8.5 },
  { month: 'Feb', revenue: 52000, orders: 380, customers: 340, orderingRate: 9.2 },
  { month: 'Mar', revenue: 48000, orders: 350, customers: 310, orderingRate: 8.8 },
  { month: 'Apr', revenue: 61000, orders: 420, customers: 380, orderingRate: 10.1 },
  { month: 'May', revenue: 58000, orders: 400, customers: 360, orderingRate: 9.6 },
  { month: 'Jun', revenue: 67000, orders: 480, customers: 420, orderingRate: 11.2 },
];

export const fallbackProductBreakdownData = [
  { 
    product: 'Stainless Travel Mug', 
    unitsSold: 421, 
    revenue: 8715, 
    aov: 20.7, 
    refunds: 122, 
    repeatOrderRate: 61,
    trend: [20, 25, 22, 28, 32, 29, 35, 31, 28, 33, 30, 35]
  },
  { 
    product: 'Kids Water Bottle', 
    unitsSold: 188, 
    revenue: 3029, 
    aov: 16.1, 
    refunds: 0, 
    repeatOrderRate: 71,
    trend: [15, 18, 16, 20, 22, 19, 25, 23, 21, 24, 22, 26]
  },
  { 
    product: 'Premium Coffee Beans', 
    unitsSold: 312, 
    revenue: 7488, 
    aov: 24.0, 
    refunds: 45, 
    repeatOrderRate: 84,
    trend: [18, 22, 20, 24, 28, 26, 32, 30, 28, 31, 29, 33]
  },
  { 
    product: 'Eco Tote Bag', 
    unitsSold: 156, 
    revenue: 1872, 
    aov: 12.0, 
    refunds: 12, 
    repeatOrderRate: 45,
    trend: [8, 10, 9, 12, 14, 13, 16, 15, 14, 16, 15, 18]
  },
  { 
    product: 'Wireless Earbuds', 
    unitsSold: 89, 
    revenue: 7120, 
    aov: 80.0, 
    refunds: 320, 
    repeatOrderRate: 38,
    trend: [5, 7, 6, 8, 10, 9, 12, 11, 10, 12, 11, 13]
  }
];

export const fallbackSegmentAnalysisData = [
  { segment: 'New Customers', revenue: 18500, orders: 142, percentage: 27.6 },
  { segment: 'Repeat Customers', revenue: 48500, orders: 338, percentage: 72.4 },
  { segment: 'VIP Customers', revenue: 15200, orders: 45, percentage: 22.7 },
  { segment: 'At-Risk Customers', revenue: 8900, orders: 67, percentage: 13.3 }
];

export const fallbackChannelBreakdownData = [
  { channel: 'Organic Search', revenue: 24500, percentage: 36.6, color: '#3b82f6' },
  { channel: 'Social Media', revenue: 18200, percentage: 27.2, color: '#10b981' },
  { channel: 'Email Marketing', revenue: 12800, percentage: 19.1, color: '#f59e0b' },
  { channel: 'Direct Traffic', revenue: 8900, percentage: 13.3, color: '#8b5cf6' },
  { channel: 'Paid Ads', revenue: 2600, percentage: 3.8, color: '#ef4444' }
];

export const fallbackProductPerformanceData = {
  topProductBySales: {
    name: 'Premium Wireless Headphones',
    revenue: 12500,
    unitsSold: 85,
    aov: 147.06,
    refundRate: 2.4
  },
  mostSoldProduct: {
    name: 'Organic Cotton T-Shirt',
    unitsSold: 342,
    revenue: 8550,
    aov: 25.00,
    refundRate: 1.2
  },
  highestAOVProduct: {
    name: 'Smart Fitness Tracker',
    aov: 299.99,
    unitsSold: 45,
    revenue: 13499,
    refundRate: 3.1
  },
  highestRefundRateProduct: {
    name: 'Bluetooth Speaker',
    refundRate: 8.7,
    unitsSold: 67,
    revenue: 4020,
    aov: 60.00
  },
  topProducts: [
    {
      product: 'Premium Wireless Headphones',
      totalRevenue: 12500,
      orders: 85,
      unitsSold: 85,
      aov: 147.06,
      refundRate: 2.4,
      firstOrdered: '2024-01-15',
      lastOrdered: '2024-06-14',
      trend: [20, 25, 22, 28, 32, 29, 35, 31, 28, 33, 30, 35]
    },
    {
      product: 'Smart Fitness Tracker',
      totalRevenue: 13499,
      orders: 45,
      unitsSold: 45,
      aov: 299.99,
      refundRate: 3.1,
      firstOrdered: '2024-02-01',
      lastOrdered: '2024-06-13',
      trend: [15, 18, 16, 20, 22, 19, 25, 23, 21, 24, 22, 26]
    },
    {
      product: 'Organic Cotton T-Shirt',
      totalRevenue: 8550,
      orders: 342,
      unitsSold: 342,
      aov: 25.00,
      refundRate: 1.2,
      firstOrdered: '2024-01-08',
      lastOrdered: '2024-06-14',
      trend: [25, 30, 28, 35, 40, 38, 45, 42, 40, 44, 41, 47]
    },
    {
      product: 'Wireless Charging Pad',
      totalRevenue: 4800,
      orders: 120,
      unitsSold: 120,
      aov: 40.00,
      refundRate: 1.8,
      firstOrdered: '2024-03-12',
      lastOrdered: '2024-06-12',
      trend: [10, 12, 11, 14, 16, 15, 18, 17, 16, 18, 17, 20]
    },
    {
      product: 'Bluetooth Speaker',
      totalRevenue: 4020,
      orders: 67,
      unitsSold: 67,
      aov: 60.00,
      refundRate: 8.7,
      firstOrdered: '2024-02-20',
      lastOrdered: '2024-06-10',
      trend: [8, 10, 9, 12, 14, 13, 16, 15, 14, 16, 15, 18]
    }
  ],
  productTrendData: [
    { date: '2024-06-01', 'Premium Wireless Headphones': 450, 'Smart Fitness Tracker': 600, 'Organic Cotton T-Shirt': 125, 'Wireless Charging Pad': 80, 'Bluetooth Speaker': 90 },
    { date: '2024-06-02', 'Premium Wireless Headphones': 520, 'Smart Fitness Tracker': 580, 'Organic Cotton T-Shirt': 140, 'Wireless Charging Pad': 85, 'Bluetooth Speaker': 75 },
    { date: '2024-06-03', 'Premium Wireless Headphones': 480, 'Smart Fitness Tracker': 620, 'Organic Cotton T-Shirt': 130, 'Wireless Charging Pad': 90, 'Bluetooth Speaker': 85 },
    { date: '2024-06-04', 'Premium Wireless Headphones': 550, 'Smart Fitness Tracker': 650, 'Organic Cotton T-Shirt': 145, 'Wireless Charging Pad': 95, 'Bluetooth Speaker': 80 },
    { date: '2024-06-05', 'Premium Wireless Headphones': 510, 'Smart Fitness Tracker': 590, 'Organic Cotton T-Shirt': 135, 'Wireless Charging Pad': 88, 'Bluetooth Speaker': 70 },
    { date: '2024-06-06', 'Premium Wireless Headphones': 580, 'Smart Fitness Tracker': 680, 'Organic Cotton T-Shirt': 150, 'Wireless Charging Pad': 100, 'Bluetooth Speaker': 95 },
    { date: '2024-06-07', 'Premium Wireless Headphones': 540, 'Smart Fitness Tracker': 640, 'Organic Cotton T-Shirt': 142, 'Wireless Charging Pad': 92, 'Bluetooth Speaker': 88 }
  ],
  productRepurchaseData: [
    { product: 'Premium Wireless Headphones', repurchaseRate: 45.2 },
    { product: 'Smart Fitness Tracker', repurchaseRate: 38.7 },
    { product: 'Organic Cotton T-Shirt', repurchaseRate: 72.1 },
    { product: 'Wireless Charging Pad', repurchaseRate: 28.3 },
    { product: 'Bluetooth Speaker', repurchaseRate: 22.4 }
  ],
  productSegmentData: [
    { product: 'Premium Wireless Headphones', newCustomers: 35, returningCustomers: 40, vipCustomers: 8, atRiskCustomers: 2 },
    { product: 'Smart Fitness Tracker', newCustomers: 20, returningCustomers: 18, vipCustomers: 5, atRiskCustomers: 2 },
    { product: 'Organic Cotton T-Shirt', newCustomers: 120, returningCustomers: 180, vipCustomers: 30, atRiskCustomers: 12 },
    { product: 'Wireless Charging Pad', newCustomers: 45, returningCustomers: 60, vipCustomers: 12, atRiskCustomers: 3 },
    { product: 'Bluetooth Speaker', newCustomers: 25, returningCustomers: 30, vipCustomers: 8, atRiskCustomers: 4 }
  ]
};

// Generate year-long monthly data for "last year" selection
export const fallbackYearlyTrendData = [
  { month: 'Jul 2023', revenue: 42000, orders: 290, customers: 250, orderingRate: 7.8 },
  { month: 'Aug 2023', revenue: 48000, orders: 340, customers: 290, orderingRate: 8.5 },
  { month: 'Sep 2023', revenue: 45000, orders: 320, customers: 280, orderingRate: 8.2 },
  { month: 'Oct 2023', revenue: 52000, orders: 380, customers: 340, orderingRate: 9.1 },
  { month: 'Nov 2023', revenue: 58000, orders: 420, customers: 380, orderingRate: 9.8 },
  { month: 'Dec 2023', revenue: 65000, orders: 480, customers: 420, orderingRate: 10.5 },
  { month: 'Jan 2024', revenue: 45000, orders: 320, customers: 280, orderingRate: 8.5 },
  { month: 'Feb 2024', revenue: 52000, orders: 380, customers: 340, orderingRate: 9.2 },
  { month: 'Mar 2024', revenue: 48000, orders: 350, customers: 310, orderingRate: 8.8 },
  { month: 'Apr 2024', revenue: 61000, orders: 420, customers: 380, orderingRate: 10.1 },
  { month: 'May 2024', revenue: 58000, orders: 400, customers: 360, orderingRate: 9.6 },
  { month: 'Jun 2024', revenue: 67000, orders: 480, customers: 420, orderingRate: 11.2 },
];

// Full 2024 data for "all_2024" selection
export const fallback2024TrendData = [
  { month: 'Jan 2024', revenue: 45000, orders: 320, customers: 280, orderingRate: 8.5 },
  { month: 'Feb 2024', revenue: 52000, orders: 380, customers: 340, orderingRate: 9.2 },
  { month: 'Mar 2024', revenue: 48000, orders: 350, customers: 310, orderingRate: 8.8 },
  { month: 'Apr 2024', revenue: 61000, orders: 420, customers: 380, orderingRate: 10.1 },
  { month: 'May 2024', revenue: 58000, orders: 400, customers: 360, orderingRate: 9.6 },
  { month: 'Jun 2024', revenue: 67000, orders: 480, customers: 420, orderingRate: 11.2 },
  { month: 'Jul 2024', revenue: 72000, orders: 520, customers: 450, orderingRate: 11.8 },
  { month: 'Aug 2024', revenue: 69000, orders: 495, customers: 430, orderingRate: 11.5 },
  { month: 'Sep 2024', revenue: 74000, orders: 540, customers: 470, orderingRate: 12.1 },
  { month: 'Oct 2024', revenue: 78000, orders: 580, customers: 510, orderingRate: 12.8 },
  { month: 'Nov 2024', revenue: 82000, orders: 620, customers: 540, orderingRate: 13.2 },
  { month: 'Dec 2024', revenue: 89000, orders: 680, customers: 590, orderingRate: 14.1 },
];

// Helper function to get trend data based on time range
export function getFallbackTrendData(timeRange: string, globalDateRange?: string) {
  // Handle specific global date ranges first
  if (globalDateRange === 'last_year') {
    return fallbackYearlyTrendData;
  }
  
  if (globalDateRange === 'all_2024' || globalDateRange === 'this_year') {
    return fallback2024TrendData;
  }
  
  // Handle custom date ranges - for demo purposes, return 2024 data
  if (globalDateRange?.startsWith('custom_')) {
    return fallback2024TrendData;
  }
  
  switch (timeRange) {
    case 'daily': return fallbackDailyTrendData;
    case 'weekly': return fallbackWeeklyTrendData;
    case 'monthly': 
      // For monthly view, default to 2024 data since user has 2024 data
      return fallback2024TrendData;
    default: return fallback2024TrendData;
  }
}

// Helper function to check if data is available
export function hasLiveData(data: any): boolean {
  if (data === null || data === undefined) {
    return false;
  }
  
  if (Array.isArray(data)) {
    return data.length > 0;
  }
  
  if (typeof data === 'object') {
    // For KPI objects, check if they have meaningful values (not all zeros)
    if (data.totalRevenue !== undefined || data.totalOrders !== undefined) {
      return data.totalRevenue > 0 || data.totalOrders > 0 || data.newCustomers > 0;
    }
    
    // For product performance data
    if (data.topProducts !== undefined) {
      return Array.isArray(data.topProducts) && data.topProducts.length > 0;
    }
    
    // For other objects, check if they have any meaningful content
    return Object.keys(data).length > 0 && Object.values(data).some(value => 
      value !== null && value !== undefined && value !== 0 && value !== ''
    );
  }
  
  return true; // For primitive values, assume they're valid
}

// Helper function to get data with fallback
export function getDataWithFallback<T>(liveData: T, fallbackData: T, useLiveData: boolean): T {
  // If user explicitly wants demo data, return fallback
  if (!useLiveData) {
    return fallbackData;
  }
  
  // If we have live data (even if it's zeros), use it
  if (liveData !== null && liveData !== undefined) {
    // For arrays, use live data even if empty (empty is valid data)
    if (Array.isArray(liveData)) {
      return liveData;
    }
    
    // For objects, use live data even if values are zero (zero is valid data)
    if (typeof liveData === 'object') {
      return liveData;
    }
    
    // For other types, use live data
    return liveData;
  }
  
  // Only fall back if live data is null/undefined (indicating a fetch error)
  return fallbackData;
}