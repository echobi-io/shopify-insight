import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useIsIFrame } from "@/hooks/useIsIFrame";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DrillThroughModal from "@/components/DrillThroughModal";
import ClickableKPICard from "@/components/ClickableKPICard";
import ClickableAIInsights from "@/components/ClickableAIInsights";
import ClickableChart from "@/components/ClickableChart";
import ClickableTable from "@/components/ClickableTable";
import ClickableComparison from "@/components/ClickableComparison";
import DataToggle from "@/components/DataToggle";
import DatabaseDebug from "@/components/DatabaseDebug";
import { useDashboardData } from "@/hooks/useDashboardData";
import { exportToCSV, exportToJSON, formatDataForExport } from "@/lib/utils/exportUtils";
import { 
  fallbackKpiData,
  fallbackSalesKpiData,
  fallbackProductBreakdownData,
  fallbackSegmentAnalysisData,
  fallbackChannelBreakdownData,
  fallbackProductPerformanceData,
  getFallbackTrendData,
  hasLiveData,
  getDataWithFallback
} from "@/lib/fallbackData";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  ShoppingBag, 
  Target, 
  DollarSign,
  AlertTriangle,
  Brain,
  PieChart,
  Activity,
  Calendar,
  Filter,
  Download,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Eye,
  UserCheck,
  UserX,
  Package,
  CreditCard,
  Clock,
  Star,
  Info,
  Percent,
  MousePointer,
  RefreshCw
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart
} from "recharts";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Enhanced Mock Data for Premium Overview
const dailyTrendData = [
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

const weeklyTrendData = [
  { week: 'Week 1', revenue: 15200, orders: 102, customers: 85, orderingRate: 9.2 },
  { week: 'Week 2', revenue: 18400, orders: 128, customers: 106, orderingRate: 10.8 },
  { week: 'Week 3', revenue: 21600, orders: 145, customers: 118, orderingRate: 11.9 },
  { week: 'Week 4', revenue: 19800, orders: 135, customers: 112, orderingRate: 11.2 },
];

const monthlyTrendData = [
  { month: 'Jan', revenue: 45000, orders: 320, customers: 280, orderingRate: 8.5 },
  { month: 'Feb', revenue: 52000, orders: 380, customers: 340, orderingRate: 9.2 },
  { month: 'Mar', revenue: 48000, orders: 350, customers: 310, orderingRate: 8.8 },
  { month: 'Apr', revenue: 61000, orders: 420, customers: 380, orderingRate: 10.1 },
  { month: 'May', revenue: 58000, orders: 400, customers: 360, orderingRate: 9.6 },
  { month: 'Jun', revenue: 67000, orders: 480, customers: 420, orderingRate: 11.2 },
];

const kpiData = {
  totalRevenue: { current: 67000, previous: 58000, change: 15.5 },
  totalOrders: { current: 480, previous: 400, change: 20.0 },
  avgOrderValue: { current: 139.58, previous: 145.00, change: -3.7 },
  customersOrdering: { current: 87.5, previous: 82.1, change: 6.6 },
  newCustomers: { current: 142, previous: 128, change: 10.9 },
  churnRisk: { current: 17.2, previous: 12.8, change: 34.4 }
};

const comparisonData = [
  { metric: 'Revenue', thisMonth: '£67,000', lastMonth: '£58,000', change: '+15.5%', trend: 'up' },
  { metric: 'Orders', thisMonth: '480', lastMonth: '400', change: '+20.0%', trend: 'up' },
  { metric: 'AOV', thisMonth: '£139.58', lastMonth: '£145.00', change: '-3.7%', trend: 'down' },
  { metric: 'Ordering Rate', thisMonth: '87.5%', lastMonth: '82.1%', change: '+6.6%', trend: 'up' },
  { metric: 'New Customers', thisMonth: '142', lastMonth: '128', change: '+10.9%', trend: 'up' },
  { metric: 'Churn Risk', thisMonth: '17.2%', lastMonth: '12.8%', change: '+34.4%', trend: 'down' },
];

const smartAlerts = [
  {
    type: 'warning',
    title: 'Churn Risk Spike',
    message: '22% increase in churn risk among February cohort customers',
    impact: 'High',
    action: 'Review retention strategy'
  },
  {
    type: 'success',
    title: 'AOV Opportunity',
    message: 'Premium product bundle showing 45% higher conversion',
    impact: 'Medium',
    action: 'Expand bundle offerings'
  },
  {
    type: 'info',
    title: 'Seasonal Trend',
    message: 'Weekend orders up 28% - consider weekend-specific promotions',
    impact: 'Medium',
    action: 'Plan weekend campaigns'
  }
];

const aiInsights = {
  summary: "Sales increased 15.5% MoM, driven by a 20% lift in order volume and strong performance from premium products. However, churn risk increased by 34%, particularly among single-purchase customers from February. The 6.6% improvement in ordering rate suggests better customer engagement, but AOV declined 3.7% indicating potential price sensitivity. Recommend implementing targeted retention campaigns for at-risk segments while maintaining current acquisition momentum.",
  keyTakeaways: [
    "Order volume growth outpacing revenue growth suggests price optimization opportunity",
    "February cohort showing concerning churn patterns - immediate intervention needed",
    "Weekend performance spike indicates untapped promotional potential"
  ]
};

// Sales & Revenue Mock Data
const salesKpiData = {
  totalRevenue: { current: 67000, previous: 58000, change: 15.5 },
  totalOrders: { current: 480, previous: 400, change: 20.0 },
  avgOrderValue: { current: 139.58, previous: 145.00, change: -3.7 },
  refundRate: { current: 2.1, previous: 1.8, change: 16.7 },
  repeatOrderRate: { current: 68.5, previous: 64.2, change: 6.7 }
};

const salesTrendData = [
  { date: '2024-06-01', revenue: 2100, orders: 15, grossRevenue: 2180, netRevenue: 2100 },
  { date: '2024-06-02', revenue: 2350, orders: 18, grossRevenue: 2420, netRevenue: 2350 },
  { date: '2024-06-03', revenue: 1980, orders: 12, grossRevenue: 2050, netRevenue: 1980 },
  { date: '2024-06-04', revenue: 2800, orders: 22, grossRevenue: 2890, netRevenue: 2800 },
  { date: '2024-06-05', revenue: 2650, orders: 19, grossRevenue: 2720, netRevenue: 2650 },
  { date: '2024-06-06', revenue: 3100, orders: 25, grossRevenue: 3200, netRevenue: 3100 },
  { date: '2024-06-07', revenue: 2900, orders: 21, grossRevenue: 2980, netRevenue: 2900 },
  { date: '2024-06-08', revenue: 2400, orders: 16, grossRevenue: 2480, netRevenue: 2400 },
  { date: '2024-06-09', revenue: 2750, orders: 20, grossRevenue: 2830, netRevenue: 2750 },
  { date: '2024-06-10', revenue: 3200, orders: 26, grossRevenue: 3300, netRevenue: 3200 },
  { date: '2024-06-11', revenue: 2850, orders: 21, grossRevenue: 2920, netRevenue: 2850 },
  { date: '2024-06-12', revenue: 2600, orders: 18, grossRevenue: 2680, netRevenue: 2600 },
  { date: '2024-06-13', revenue: 3400, orders: 28, grossRevenue: 3500, netRevenue: 3400 },
  { date: '2024-06-14', revenue: 3100, orders: 24, grossRevenue: 3180, netRevenue: 3100 },
];

const productBreakdownData = [
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

const timeComparisonData = [
  { metric: 'Revenue', thisMonth: '£67,000', lastMonth: '£58,000', deltaPercent: 15.5, yoyPercent: 12.5, trend: 'up' as const },
  { metric: 'Orders', thisMonth: '480', lastMonth: '400', deltaPercent: 20.0, yoyPercent: 10.2, trend: 'up' as const },
  { metric: 'AOV', thisMonth: '£139.58', lastMonth: '£145.00', deltaPercent: -3.7, yoyPercent: 2.1, trend: 'down' as const },
  { metric: 'Refunds', thisMonth: '£1,407', lastMonth: '£1,044', deltaPercent: 34.8, yoyPercent: -5.2, trend: 'down' as const },
  { metric: 'Repeat Orders', thisMonth: '68.5%', lastMonth: '64.2%', deltaPercent: 6.7, yoyPercent: 8.9, trend: 'up' as const }
];

const segmentAnalysisData = [
  { segment: 'New Customers', revenue: 18500, orders: 142, percentage: 27.6 },
  { segment: 'Repeat Customers', revenue: 48500, orders: 338, percentage: 72.4 },
  { segment: 'VIP Customers', revenue: 15200, orders: 45, percentage: 22.7 },
  { segment: 'At-Risk Customers', revenue: 8900, orders: 67, percentage: 13.3 }
];

const channelBreakdownData = [
  { channel: 'Organic Search', revenue: 24500, percentage: 36.6, color: '#3b82f6' },
  { channel: 'Social Media', revenue: 18200, percentage: 27.2, color: '#10b981' },
  { channel: 'Email Marketing', revenue: 12800, percentage: 19.1, color: '#f59e0b' },
  { channel: 'Direct Traffic', revenue: 8900, percentage: 13.3, color: '#8b5cf6' },
  { channel: 'Paid Ads', revenue: 2600, percentage: 3.8, color: '#ef4444' }
];

const salesAiInsights = {
  summary: "Revenue increased 15.5% MoM driven by strong performance in Stainless Travel Mugs (+32%) and improved repeat customer engagement (+6.7%). However, AOV declined 3.7% and refund rates increased 34.8%, primarily due to quality issues with Wireless Earbuds. Recommend immediate product review and targeted retention campaigns for high-value segments.",
  keyTakeaways: [
    "Stainless Travel Mug showing exceptional growth - consider expanding product line",
    "Wireless Earbuds driving high refund rates - investigate quality control issues",
    "Repeat customer rate improvement suggests successful retention strategies",
    "New customer acquisition up 20% - maintain current marketing momentum"
  ]
};

// Legacy data for other tabs
const churnData = [
  { month: 'Jan', churnRate: 8.2, retained: 91.8 },
  { month: 'Feb', churnRate: 7.8, retained: 92.2 },
  { month: 'Mar', churnRate: 9.1, retained: 90.9 },
  { month: 'Apr', churnRate: 6.5, retained: 93.5 },
  { month: 'May', churnRate: 7.2, retained: 92.8 },
  { month: 'Jun', churnRate: 5.8, retained: 94.2 },
];

const customerSegments = [
  { name: 'Champions', value: 25, color: '#22c55e' },
  { name: 'Loyal Customers', value: 20, color: '#3b82f6' },
  { name: 'Potential Loyalists', value: 18, color: '#8b5cf6' },
  { name: 'At Risk', value: 15, color: '#f59e0b' },
  { name: 'Cannot Lose Them', value: 12, color: '#ef4444' },
  { name: 'Others', value: 10, color: '#6b7280' },
];

const topProducts = [
  { name: 'Premium Headphones', revenue: 12500, units: 85, trend: 'up' },
  { name: 'Wireless Earbuds', revenue: 9800, units: 120, trend: 'up' },
  { name: 'Smart Watch', revenue: 8200, units: 45, trend: 'down' },
  { name: 'Phone Case', revenue: 6500, units: 200, trend: 'up' },
  { name: 'Charging Cable', revenue: 4200, units: 150, trend: 'stable' },
];

const atRiskCustomers = [
  { name: 'Sarah Johnson', email: 'sarah@email.com', ltv: 1250, riskScore: 85, lastOrder: '45 days ago' },
  { name: 'Mike Chen', email: 'mike@email.com', ltv: 980, riskScore: 78, lastOrder: '38 days ago' },
  { name: 'Emma Davis', email: 'emma@email.com', ltv: 1450, riskScore: 72, lastOrder: '42 days ago' },
  { name: 'Alex Wilson', email: 'alex@email.com', ltv: 820, riskScore: 69, lastOrder: '35 days ago' },
];

export default function Dashboard() {
  const { signOut, user } = useAuth();
  const isEmbedded = useIsIFrame();
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("monthly");
  const [selectedSegment, setSelectedSegment] = useState("all");
  const [revenueType, setRevenueType] = useState("net");
  const [chartView, setChartView] = useState("revenue");
  const [globalDateRange, setGlobalDateRange] = useState("last_30_days");
  
  // Data toggle state - controls whether to use live data or demo data
  const [useLiveData, setUseLiveData] = useState(true);
  
  // Drill-through modal state
  const [drillThroughModal, setDrillThroughModal] = useState<{
    isOpen: boolean;
    data: any;
  }>({ isOpen: false, data: null });
  
  // Mock user for development
  const displayUser = user || { email: 'admin@shopifyiq.com' };

  // Use Supabase data
  const {
    kpiData: realKpiData,
    salesKpiData: realSalesKpiData,
    revenueData: realRevenueData,
    productData: realProductData,
    segmentData: realSegmentData,
    channelData: realChannelData,
    productPerformanceData: realProductPerformanceData,
    loading,
    error,
    refetch,
    updateFilters
  } = useDashboardData(globalDateRange, selectedSegment, useLiveData);

  // Get trend data based on selected time range
  const getTrendData = () => {
    switch (timeRange) {
      case 'daily': return dailyTrendData;
      case 'weekly': return weeklyTrendData;
      case 'monthly': return monthlyTrendData;
      default: return monthlyTrendData;
    }
  };

  // Data status for the toggle component
  const dataStatus = {
    kpis: hasLiveData(realKpiData),
    revenue: hasLiveData(realRevenueData),
    products: hasLiveData(realProductData),
    segments: hasLiveData(realSegmentData),
    channels: hasLiveData(realChannelData),
    productPerformance: hasLiveData(realProductPerformanceData)
  };

  // Use data directly based on toggle - no automatic fallback
  const currentKpiData = useLiveData ? (realKpiData || {
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    percentOrdering: 0,
    newCustomers: 0,
    churnRisk: 0
  }) : fallbackKpiData;
  
  const currentSalesKpiData = useLiveData ? (realSalesKpiData || {
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    refundRate: 0,
    repeatOrderRate: 0
  }) : fallbackSalesKpiData;
  
  const currentRevenueData = useLiveData ? (realRevenueData || []) : getFallbackTrendData(timeRange);
  const currentProductData = useLiveData ? (realProductData || []) : fallbackProductBreakdownData;
  const currentSegmentData = useLiveData ? (realSegmentData || []) : fallbackSegmentAnalysisData;
  const currentChannelData = useLiveData ? (realChannelData || []) : fallbackChannelBreakdownData;
  const currentProductPerformanceData = useLiveData ? (realProductPerformanceData || {
    topProductBySales: { name: 'No Data', revenue: 0, unitsSold: 0, aov: 0, refundRate: 0 },
    mostSoldProduct: { name: 'No Data', unitsSold: 0, revenue: 0, aov: 0, refundRate: 0 },
    highestAOVProduct: { name: 'No Data', aov: 0, unitsSold: 0, revenue: 0, refundRate: 0 },
    highestRefundRateProduct: { name: 'No Data', refundRate: 0, unitsSold: 0, revenue: 0, aov: 0 },
    topProducts: [],
    productTrendData: [],
    productRepurchaseData: [],
    productSegmentData: []
  }) : fallbackProductPerformanceData;

  // Check if we have any live data available
  const hasAnyLiveData = Object.values(dataStatus).some(Boolean);

  // Handle export functionality
  const handleExport = (data: any[], type: string, format: 'csv' | 'json' = 'csv') => {
    const formattedData = formatDataForExport(data, type as any);
    const filename = `shopifyiq-${type}-${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'csv') {
      exportToCSV(formattedData, filename);
    } else {
      exportToJSON(formattedData, filename);
    }
  };

  // Generate drill-through data
  const generateDrillThroughData = (type: string, filters?: any) => {
    const baseData = {
      filters: {
        dateRange: timeRange === 'daily' ? 'Last 14 days' : timeRange === 'weekly' ? 'Last 4 weeks' : 'Last 6 months',
        segment: selectedSegment !== 'all' ? selectedSegment : undefined,
        ...filters
      }
    };

    switch (type) {
      case 'revenue':
        return {
          ...baseData,
          type: 'revenue' as const,
          title: 'Revenue Breakdown',
          subtitle: `Detailed revenue analysis for ${baseData.filters.dateRange}`,
          value: '£67,000',
          change: '+15.5% vs last period',
          changeType: 'positive' as const,
          data: Array.from({ length: 50 }, (_, i) => ({
            date: `2024-06-${String(i + 1).padStart(2, '0')}`,
            order_id: `ORD-${1000 + i}`,
            customer: `Customer ${i + 1}`,
            product: ['Stainless Travel Mug', 'Coffee Beans', 'Water Bottle'][i % 3],
            value: Math.floor(Math.random() * 500) + 50,
            status: Math.random() > 0.1 ? 'completed' : 'pending'
          }))
        };

      case 'orders':
        return {
          ...baseData,
          type: 'orders' as const,
          title: 'Orders Breakdown',
          subtitle: `Detailed orders analysis for ${baseData.filters.dateRange}`,
          value: '480',
          change: '+20.0% vs last period',
          changeType: 'positive' as const,
          data: Array.from({ length: 50 }, (_, i) => ({
            date: `2024-06-${String(i + 1).padStart(2, '0')}`,
            order_id: `ORD-${1000 + i}`,
            customer: `Customer ${i + 1}`,
            items: Math.floor(Math.random() * 5) + 1,
            value: Math.floor(Math.random() * 500) + 50,
            status: Math.random() > 0.1 ? 'completed' : 'pending'
          }))
        };

      case 'aov':
        return {
          ...baseData,
          type: 'aov' as const,
          title: 'Average Order Value Distribution',
          subtitle: `AOV breakdown for ${baseData.filters.dateRange}`,
          value: '£139.58',
          change: '-3.7% vs last period',
          changeType: 'negative' as const,
          data: [
            { range: '£0-50', count: 45 },
            { range: '£51-100', count: 120 },
            { range: '£101-150', count: 180 },
            { range: '£151-200', count: 95 },
            { range: '£201-300', count: 35 },
            { range: '£300+', count: 15 }
          ]
        };

      case 'customers':
        return {
          ...baseData,
          type: 'customers' as const,
          title: 'Customer Details',
          subtitle: `Customer analysis for ${baseData.filters.dateRange}`,
          value: '142',
          change: '+10.9% vs last period',
          changeType: 'positive' as const,
          data: Array.from({ length: 50 }, (_, i) => ({
            name: `Customer ${i + 1}`,
            email: `customer${i + 1}@email.com`,
            signup_date: `2024-06-${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')}`,
            orders: Math.floor(Math.random() * 10) + 1,
            ltv: Math.floor(Math.random() * 2000) + 200,
            segment: ['New', 'Repeat', 'VIP', 'At-Risk'][Math.floor(Math.random() * 4)]
          }))
        };

      case 'churn':
        return {
          ...baseData,
          type: 'churn' as const,
          title: 'Churn Risk Analysis',
          subtitle: `High-risk customers for ${baseData.filters.dateRange}`,
          value: '17.2%',
          change: '+34.4% vs last period',
          changeType: 'negative' as const,
          data: Array.from({ length: 30 }, (_, i) => ({
            customer: `Customer ${i + 1}`,
            last_order: `${Math.floor(Math.random() * 60) + 30} days ago`,
            risk_score: `${Math.floor(Math.random() * 40) + 60}%`,
            predicted_churn: `${Math.floor(Math.random() * 30) + 70}%`,
            ltv: Math.floor(Math.random() * 1500) + 500,
            action: ['Email Campaign', 'Discount Offer', 'Personal Outreach'][Math.floor(Math.random() * 3)]
          }))
        };

      // Sales & Revenue specific drill-through data
      case 'sales-revenue':
        return {
          ...baseData,
          type: 'sales-revenue' as const,
          title: 'Sales Revenue Breakdown',
          subtitle: `Detailed sales revenue analysis for ${baseData.filters.dateRange}`,
          value: '£67,000',
          change: '+15.5% vs last period',
          changeType: 'positive' as const,
          data: Array.from({ length: 50 }, (_, i) => ({
            date: `2024-06-${String(i + 1).padStart(2, '0')}`,
            order_id: `ORD-${2000 + i}`,
            customer: `Customer ${i + 1}`,
            product: ['Stainless Travel Mug', 'Kids Water Bottle', 'Premium Coffee Beans', 'Eco Tote Bag', 'Wireless Earbuds'][i % 5],
            value: Math.floor(Math.random() * 500) + 50,
            refunds: Math.floor(Math.random() * 50),
            status: Math.random() > 0.1 ? 'completed' : 'pending'
          }))
        };

      case 'sales-orders':
        return {
          ...baseData,
          type: 'sales-orders' as const,
          title: 'Sales Orders Analysis',
          subtitle: `Detailed sales orders for ${baseData.filters.dateRange}`,
          value: '480',
          change: '+20.0% vs last period',
          changeType: 'positive' as const,
          data: Array.from({ length: 50 }, (_, i) => ({
            date: `2024-06-${String(i + 1).padStart(2, '0')}`,
            order_id: `ORD-${2000 + i}`,
            customer: `Customer ${i + 1}`,
            items: Math.floor(Math.random() * 5) + 1,
            value: Math.floor(Math.random() * 500) + 50,
            aov: Math.floor(Math.random() * 200) + 100,
            status: Math.random() > 0.1 ? 'completed' : 'pending'
          }))
        };

      case 'refunds':
        return {
          ...baseData,
          type: 'refunds' as const,
          title: 'Refunds Analysis',
          subtitle: `Refund details for ${baseData.filters.dateRange}`,
          value: '£1,407',
          change: '+34.8% vs last period',
          changeType: 'negative' as const,
          data: Array.from({ length: 30 }, (_, i) => ({
            date: `2024-06-${String(i + 1).padStart(2, '0')}`,
            order_id: `ORD-${1500 + i}`,
            customer: `Customer ${i + 1}`,
            product: ['Wireless Earbuds', 'Kids Water Bottle', 'Premium Coffee Beans'][i % 3],
            amount: Math.floor(Math.random() * 200) + 20,
            reason: ['Defective', 'Not as described', 'Changed mind', 'Damaged in shipping'][Math.floor(Math.random() * 4)],
            status: Math.random() > 0.3 ? 'processed' : 'pending'
          }))
        };

      case 'retention':
        return {
          ...baseData,
          type: 'retention' as const,
          title: 'Customer Retention Analysis',
          subtitle: `Retention cohorts for ${baseData.filters.dateRange}`,
          value: '68.5%',
          change: '+6.7% vs last period',
          changeType: 'positive' as const,
          data: Array.from({ length: 12 }, (_, i) => ({
            cohort: `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]} 2024`,
            customers: Math.floor(Math.random() * 500) + 800,
            month1: Math.floor(Math.random() * 30) + 70,
            month2: Math.floor(Math.random() * 25) + 55,
            month3: Math.floor(Math.random() * 20) + 45,
            month6: Math.floor(Math.random() * 15) + 35,
            retention: Math.floor(Math.random() * 20) + 60
          }))
        };

      case 'trends':
        return {
          ...baseData,
          type: 'trends' as const,
          title: 'Sales Trends Analysis',
          subtitle: `Trend breakdown for ${filters?.date || baseData.filters.dateRange}`,
          value: filters?.date || 'Selected Period',
          change: '+15.8% vs previous period',
          changeType: 'positive' as const,
          data: Array.from({ length: 24 }, (_, i) => ({
            hour: `${String(i).padStart(2, '0')}:00`,
            revenue: Math.floor(Math.random() * 5000) + 1000,
            orders: Math.floor(Math.random() * 30) + 5,
            conversion: (Math.random() * 3 + 2).toFixed(1),
            aov: Math.floor(Math.random() * 100) + 150
          }))
        };

      case 'product-sales':
        return {
          ...baseData,
          type: 'product-sales' as const,
          title: `Product Sales: ${filters?.product || 'All Products'}`,
          subtitle: `Product performance for ${baseData.filters.dateRange}`,
          value: filters?.product ? '£8,715' : '£67,000',
          change: '+22.3% vs last period',
          changeType: 'positive' as const,
          data: Array.from({ length: 30 }, (_, i) => ({
            date: `2024-06-${String(i + 1).padStart(2, '0')}`,
            revenue: Math.floor(Math.random() * 1000) + 200,
            units: Math.floor(Math.random() * 20) + 5,
            refunds: Math.floor(Math.random() * 50),
            customers: Math.floor(Math.random() * 15) + 3,
            repeatOrders: Math.floor(Math.random() * 10)
          }))
        };

      case 'segment-analysis':
        return {
          ...baseData,
          type: 'segment-analysis' as const,
          title: `Segment Analysis: ${filters?.segment || 'All Segments'}`,
          subtitle: `Customer segment breakdown for ${baseData.filters.dateRange}`,
          value: filters?.segment === 'VIP' ? '£15,200' : '£67,000',
          change: '+28.4% vs last period',
          changeType: 'positive' as const,
          data: [
            { segment: 'New Customers', customers: 142, revenue: 18500, orders: 142, aov: 130.28, retention: 23 },
            { segment: 'Repeat Customers', customers: 338, revenue: 48500, orders: 456, aov: 106.36, retention: 67 },
            { segment: 'VIP Customers', customers: 45, revenue: 15200, orders: 89, aov: 337.78, retention: 89 },
            { segment: 'At-Risk Customers', customers: 67, revenue: 8900, orders: 78, aov: 114.10, retention: 12 }
          ]
        };

      case 'channel-analysis':
        return {
          ...baseData,
          type: 'channel-analysis' as const,
          title: `Channel Analysis: ${filters?.channel || 'All Channels'}`,
          subtitle: `Channel performance for ${baseData.filters.dateRange}`,
          value: filters?.channel === 'Organic Search' ? '£24,500' : '£67,000',
          change: '+19.7% vs last period',
          changeType: 'positive' as const,
          data: [
            { channel: 'Organic Search', revenue: 24500, orders: 234, aov: 104.70, conversion: 3.4, sessions: 6890 },
            { channel: 'Social Media', revenue: 18200, orders: 189, aov: 96.30, conversion: 2.8, sessions: 6750 },
            { channel: 'Email Marketing', revenue: 12800, orders: 145, aov: 88.28, conversion: 8.9, sessions: 1629 },
            { channel: 'Direct Traffic', revenue: 8900, orders: 98, aov: 90.82, conversion: 4.2, sessions: 2333 },
            { channel: 'Paid Ads', revenue: 2600, orders: 34, aov: 76.47, conversion: 2.1, sessions: 1619 }
          ]
        };

      default:
        return null;
    }
  };

  // Handle drill-through clicks
  const handleDrillThrough = (type: string, filters?: any) => {
    const data = generateDrillThroughData(type, filters);
    if (data) {
      setDrillThroughModal({ isOpen: true, data });
    }
  };

  // Handle AI insight clicks
  const handleAIInsightClick = (drillType: string, filters?: any) => {
    handleDrillThrough(drillType, filters);
  };

  // Sparkline component for product trends
  const Sparkline = ({ data, color = "#10b981" }: { data: number[], color?: string }) => (
    <div className="w-16 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.map((value, index) => ({ value, index }))}>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={1.5} 
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  // Premium KPI Card Component
  const PremiumKPICard = ({ title, current, previous, change, icon: Icon, hasAlert = false, tooltip = "" }: any) => {
    const isPositive = change > 0;
    const isNegative = change < 0;
    const trendColor = title === 'Churn Risk' ? (isPositive ? 'text-red-500' : 'text-green-500') : (isPositive ? 'text-green-500' : 'text-red-500');
    const bgColor = title === 'Churn Risk' ? (isPositive ? 'bg-red-50 dark:bg-red-950' : 'bg-green-50 dark:bg-green-950') : (isPositive ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950');
    
    return (
      <motion.div variants={fadeInUp} className="group cursor-pointer">
        <Card className="hover:border-primary/50 transition-all duration-200 relative overflow-hidden">
          {hasAlert && (
            <div className="absolute top-2 right-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
          )}
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-muted-foreground">{title}</p>
                  {tooltip && (
                    <Info className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold tracking-tight">
                    {typeof current === 'number' && current > 1000 ? 
                      `$${current.toLocaleString()}` : 
                      typeof current === 'number' && title.includes('%') ? 
                      `${current}%` : 
                      typeof current === 'number' ? 
                      current.toLocaleString() : 
                      current
                    }
                  </p>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}>
                    {isPositive ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : isNegative ? (
                      <ArrowDownRight className="w-3 h-3" />
                    ) : (
                      <Activity className="w-3 h-3" />
                    )}
                    <span className={trendColor}>
                      {change > 0 ? '+' : ''}{change.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                </div>
              </div>
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon className="w-7 h-7 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Legacy MetricCard for other tabs
  const MetricCard = ({ title, value, change, icon: Icon, trend }: any) => (
    <motion.div variants={fadeInUp}>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              <div className="flex items-center mt-1">
                {trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {change}
                </span>
                <span className="text-sm text-muted-foreground ml-1">vs last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className={`flex min-h-screen bg-background ${isEmbedded ? 'embedded-app' : ''}`}>
      {/* Sidebar - Hidden when embedded */}
      {!isEmbedded && (
        <motion.aside 
          className="w-64 border-r border-border bg-card"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-8">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">ShopifyIQ</span>
            </div>

            <nav className="space-y-2">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'sales', label: 'Sales & Revenue', icon: TrendingUp },
                { id: 'product-performance', label: 'Product Performance', icon: Package },
                { id: 'customers', label: 'Customers', icon: Users },
                { id: 'churn', label: 'Churn & Retention', icon: UserX },
                { id: 'products', label: 'Product Insights', icon: Package },
                { id: 'predictions', label: 'AI Predictions', icon: Brain },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === item.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayUser?.email}</p>
                <p className="text-xs text-muted-foreground">Pro Plan</p>
              </div>
            </div>
            <Button
              onClick={() => {
                if (user) {
                  signOut();
                } else {
                  window.location.href = '/';
                }
              }}
              variant="ghost"
              size="sm"
              className="w-full justify-start"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {user ? 'Sign Out' : 'Back to Home'}
            </Button>
          </div>
        </motion.aside>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <motion.header 
          className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Monitor your store's performance and growth</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={globalDateRange} onValueChange={(value) => {
                setGlobalDateRange(value);
                // Map global date range to timeRange for data fetching
                switch(value) {
                  case 'last_7_days':
                    setTimeRange('daily');
                    break;
                  case 'last_30_days':
                    setTimeRange('weekly');
                    break;
                  case 'last_90_days':
                    setTimeRange('monthly');
                    break;
                  default:
                    setTimeRange('monthly');
                }
              }}>
                <SelectTrigger className="w-40">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7_days">Last 7 days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 days</SelectItem>
                  <SelectItem value="last_90_days">Last 90 days</SelectItem>
                  <SelectItem value="last_6_months">Last 6 months</SelectItem>
                  <SelectItem value="last_year">Last year</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => handleExport(currentRevenueData, 'dashboard', 'csv')}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Alerts
              </Button>
            </div>
          </div>
        </motion.header>

        <div className={`p-6 ${isEmbedded ? 'p-4' : 'p-6'}`}>
          {/* Navigation Tabs - Always visible */}
          <motion.div 
            variants={fadeInUp}
            className="mb-6"
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="text-lg font-bold">ShopifyIQ</span>
                  </div>
                  {isEmbedded && (
                    <Badge variant="secondary" className="text-xs">
                      Embedded App
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'sales', label: 'Sales & Revenue', icon: TrendingUp },
                    { id: 'product-performance', label: 'Product Performance', icon: Package },
                    { id: 'customers', label: 'Customers', icon: Users },
                    { id: 'churn', label: 'Retention', icon: UserX },
                    { id: 'products', label: 'Product Insights', icon: Package },
                    { id: 'predictions', label: 'AI Predictions', icon: Brain },
                  ].map((item) => (
                    <Button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      variant={activeTab === item.id ? "default" : "outline"}
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Data Toggle - Emergency Fallback System */}
          <motion.div variants={fadeInUp} className="mb-6">
            <DataToggle
              useLiveData={useLiveData}
              onToggle={setUseLiveData}
              hasLiveData={hasAnyLiveData}
              dataStatus={dataStatus}
            />
          </motion.div>

          {/* Database Debug Panel - Only show when Live Data is enabled */}
          {useLiveData && (
            <motion.div variants={fadeInUp} className="mb-6">
              <DatabaseDebug merchantId="11111111-1111-1111-1111-111111111111" />
            </motion.div>
          )}

          {/* Premium Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              {/* Global Filters */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Filters:</span>
                      </div>
                      <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Customers</SelectItem>
                          <SelectItem value="champions">Champions</SelectItem>
                          <SelectItem value="loyal">Loyal Customers</SelectItem>
                          <SelectItem value="at-risk">At Risk</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={refetch}
                        disabled={loading}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Premium KPI Dashboard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-20 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <>
                    <ClickableKPICard
                      title="Total Revenue"
                      value={`£${currentKpiData.totalRevenue.toLocaleString()}`}
                      change={`+15.5% vs last month`}
                      changeType="positive"
                      icon={<DollarSign className="w-5 h-5" />}
                      onClick={() => handleDrillThrough('revenue')}
                    />
                    <ClickableKPICard
                      title="Total Orders"
                      value={currentKpiData.totalOrders.toLocaleString()}
                      change={`+20.0% vs last month`}
                      changeType="positive"
                      icon={<ShoppingBag className="w-5 h-5" />}
                      onClick={() => handleDrillThrough('orders')}
                    />
                    <ClickableKPICard
                      title="Avg Order Value"
                      value={`£${currentKpiData.avgOrderValue.toFixed(2)}`}
                      change={`-3.7% vs last month`}
                      changeType="negative"
                      icon={<CreditCard className="w-5 h-5" />}
                      onClick={() => handleDrillThrough('aov')}
                    />
                    <ClickableKPICard
                      title="Customers Ordering %"
                      value={`${currentKpiData.percentOrdering}%`}
                      change={`+6.6% vs last month`}
                      changeType="positive"
                      icon={<Percent className="w-5 h-5" />}
                      onClick={() => handleDrillThrough('customers', { segment: 'ordering' })}
                    />
                    <ClickableKPICard
                      title="New Customers"
                      value={currentKpiData.newCustomers.toLocaleString()}
                      change={`+10.9% vs last month`}
                      changeType="positive"
                      icon={<Users className="w-5 h-5" />}
                      onClick={() => handleDrillThrough('customers', { segment: 'new' })}
                    />
                    <ClickableKPICard
                      title="Churn Risk %"
                      value={`${currentKpiData.churnRisk}%`}
                      change={`+34.4% vs last month`}
                      changeType="negative"
                      icon={<AlertTriangle className="w-5 h-5" />}
                      onClick={() => handleDrillThrough('churn')}
                    />
                  </>
                )}
              </div>

              {/* Sales & Engagement Trend Line */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Sales & Engagement Trends
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <ComposedChart data={currentRevenueData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis 
                          dataKey={timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'week' : 'month'} 
                          fontSize={12}
                        />
                        <YAxis yAxisId="left" fontSize={12} />
                        <YAxis yAxisId="right" orientation="right" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Area 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#3b82f6" 
                          fill="#3b82f6" 
                          fillOpacity={0.1}
                          name="Revenue ($)"
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="orders" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          name="Orders"
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="orderingRate" 
                          stroke="#f59e0b" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Ordering Rate (%)"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Comparison Summary Panel */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Period Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Metric</th>
                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">This Month</th>
                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Last Month</th>
                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(currentKpiData.comparisonData || []).map((row, index) => (
                            <tr key={index} className="border-b border-border/50">
                              <td className="py-3 px-4 font-medium">{row.metric}</td>
                              <td className="text-right py-3 px-4">{row.thisMonth}</td>
                              <td className="text-right py-3 px-4 text-muted-foreground">{row.lastMonth}</td>
                              <td className="text-right py-3 px-4">
                                <div className={`flex items-center justify-end gap-1 ${
                                  row.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {row.trend === 'up' ? (
                                    <ArrowUpRight className="w-4 h-4" />
                                  ) : (
                                    <ArrowDownRight className="w-4 h-4" />
                                  )}
                                  <span className="font-medium">{row.change}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* AI Summary Box */}
              <motion.div variants={fadeInUp}>
                <ClickableAIInsights
                  insights={[aiInsights.summary, ...aiInsights.keyTakeaways]}
                  onInsightClick={handleAIInsightClick}
                />
              </motion.div>

              {/* Smart Alerts Panel */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-primary" />
                      Smart Alerts
                      <Badge variant="destructive" className="ml-2">3 Active</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {smartAlerts.map((alert, index) => (
                        <div 
                          key={index} 
                          className={`p-4 rounded-lg border-l-4 ${
                            alert.type === 'warning' 
                              ? 'bg-orange-50 dark:bg-orange-950 border-orange-500' 
                              : alert.type === 'success'
                              ? 'bg-green-50 dark:bg-green-950 border-green-500'
                              : 'bg-blue-50 dark:bg-blue-950 border-blue-500'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm">{alert.title}</h4>
                                <Badge 
                                  variant={alert.impact === 'High' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {alert.impact} Impact
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                              <p className="text-xs font-medium text-primary">{alert.action}</p>
                            </div>
                            <Button size="sm" variant="outline" className="ml-4">
                              <MousePointer className="w-3 h-3 mr-1" />
                              Act
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* Sales & Revenue Tab */}
          {activeTab === 'sales' && (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              {/* Global Filters */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Filters:</span>
                      </div>
                      <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Customers</SelectItem>
                          <SelectItem value="new">New Customers</SelectItem>
                          <SelectItem value="repeat">Repeat Customers</SelectItem>
                          <SelectItem value="vip">VIP Customers</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={revenueType} onValueChange={setRevenueType}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="net">Net Revenue</SelectItem>
                          <SelectItem value="gross">Gross Revenue</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Headline KPI Strip */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-20 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <>
                    <ClickableKPICard
                      title="Total Revenue"
                      value={`£${currentSalesKpiData.totalRevenue.toLocaleString()}`}
                      change={`+15.5% vs last month`}
                      changeType="positive"
                      icon={<DollarSign className="w-5 h-5" />}
                      onClick={() => handleDrillThrough('sales-revenue')}
                    />
                    <ClickableKPICard
                      title="Total Orders"
                      value={currentSalesKpiData.totalOrders.toLocaleString()}
                      change={`+20.0% vs last month`}
                      changeType="positive"
                      icon={<ShoppingBag className="w-5 h-5" />}
                      onClick={() => handleDrillThrough('sales-orders')}
                    />
                    <ClickableKPICard
                      title="Average Order Value"
                      value={`£${currentSalesKpiData.avgOrderValue.toFixed(2)}`}
                      change={`-3.7% vs last month`}
                      changeType="negative"
                      icon={<CreditCard className="w-5 h-5" />}
                      onClick={() => handleDrillThrough('aov', { context: 'sales' })}
                    />
                    <ClickableKPICard
                      title="Refund Rate"
                      value={`${currentSalesKpiData.refundRate}%`}
                      change={`+16.7% vs last month`}
                      changeType="negative"
                      icon={<AlertTriangle className="w-5 h-5" />}
                      onClick={() => handleDrillThrough('refunds')}
                    />
                    <ClickableKPICard
                      title="Repeat Order Rate"
                      value={`${currentSalesKpiData.repeatOrderRate}%`}
                      change={`+6.7% vs last month`}
                      changeType="positive"
                      icon={<UserCheck className="w-5 h-5" />}
                      onClick={() => handleDrillThrough('retention')}
                    />
                  </>
                )}
              </div>

              {/* Sales Trend Chart */}
              <ClickableChart
                title="Sales Performance Trends"
                icon={<TrendingUp className="w-5 h-5 text-primary" />}
                onChartClick={(data) => handleDrillThrough('trends', { date: data?.activeLabel })}
                onDetailsClick={() => handleDrillThrough('trends')}
              >
                <div className="flex items-center justify-between mb-4">
                  <Select value={chartView} onValueChange={setChartView}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="orders">Orders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart 
                    data={salesTrendData}
                    onClick={(data) => {
                      if (data && data.activeLabel) {
                        handleDrillThrough('trends', { date: data.activeLabel });
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any, name: string) => {
                        if (name === 'revenue') return [`£${value.toLocaleString()}`, 'Revenue'];
                        if (name === 'orders') return [value, 'Orders'];
                        return [value, name];
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey={chartView === 'revenue' ? (revenueType === 'gross' ? 'grossRevenue' : 'revenue') : 'orders'}
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ClickableChart>

              {/* Revenue Breakdown by Product */}
              <ClickableTable
                title="Product Performance Breakdown"
                icon={<Package className="w-5 h-5 text-primary" />}
                onExport={() => console.log('Export product data')}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Product</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Units Sold</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Revenue</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">AOV</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Refunds</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Repeat %</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProductData.map((product, index) => (
                        <tr 
                          key={index} 
                          className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleDrillThrough('product-sales', { product: product.product })}
                        >
                          <td className="py-3 px-4 font-medium">{product.product}</td>
                          <td className="text-right py-3 px-4">{product.unitsSold.toLocaleString()}</td>
                          <td className="text-right py-3 px-4">£{product.revenue.toLocaleString()}</td>
                          <td className="text-right py-3 px-4">£{product.aov.toFixed(1)}</td>
                          <td className="text-right py-3 px-4">
                            <span 
                              className={`${product.refunds > 100 ? 'text-red-600' : 'text-muted-foreground'} cursor-pointer hover:underline`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDrillThrough('refunds', { product: product.product });
                              }}
                            >
                              £{product.refunds}
                            </span>
                          </td>
                          <td className="text-right py-3 px-4">
                            <span 
                              className={`${product.repeatOrderRate > 60 ? 'text-green-600' : 'text-muted-foreground'} cursor-pointer hover:underline`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDrillThrough('retention', { product: product.product });
                              }}
                            >
                              {product.repeatOrderRate}%
                            </span>
                          </td>
                          <td className="text-right py-3 px-4">
                            <Sparkline data={product.trend} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ClickableTable>

              {/* Time Comparison Panel */}
              <ClickableComparison
                title="Period Comparison Analysis"
                subtitle="Click on deltas to explore what drove the changes"
                icon={<Calendar className="w-5 h-5 text-primary" />}
                badge="Interactive"
                data={currentKpiData.comparisonData || []}
                onDeltaClick={(metric, period) => {
                  handleDrillThrough('trends', { 
                    metric: metric.toLowerCase(), 
                    period,
                    comparison: true 
                  });
                }}
                onExport={() => console.log('Export comparison data')}
              />

              {/* Segment Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ClickableChart
                  title="Revenue by Customer Segment"
                  icon={<Users className="w-5 h-5 text-primary" />}
                  onChartClick={(data) => {
                    if (data && data.activeLabel) {
                      handleDrillThrough('segment-analysis', { segment: data.activeLabel });
                    }
                  }}
                  onDetailsClick={() => handleDrillThrough('segment-analysis')}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart 
                      data={currentSegmentData} 
                      layout="horizontal"
                      onClick={(data) => {
                        if (data && data.activeLabel) {
                          handleDrillThrough('segment-analysis', { segment: data.activeLabel });
                        }
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis type="number" fontSize={12} />
                      <YAxis dataKey="segment" type="category" fontSize={12} width={100} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: any) => [`£${value.toLocaleString()}`, 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ClickableChart>

                <ClickableChart
                  title="Revenue by Channel"
                  icon={<Target className="w-5 h-5 text-primary" />}
                  onChartClick={(data) => {
                    if (data && data.activeLabel) {
                      handleDrillThrough('channel-analysis', { channel: data.activeLabel });
                    }
                  }}
                  onDetailsClick={() => handleDrillThrough('channel-analysis')}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart
                      onClick={(data) => {
                        if (data && data.activeLabel) {
                          handleDrillThrough('channel-analysis', { channel: data.activeLabel });
                        }
                      }}
                    >
                      <Pie
                        data={currentChannelData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="revenue"
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                      >
                        {currentChannelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: any) => [`£${value.toLocaleString()}`, 'Revenue']}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ClickableChart>
              </div>

              {/* AI-Powered Narrative Insight */}
              <motion.div variants={fadeInUp}>
                <ClickableAIInsights
                  insights={[salesAiInsights.summary, ...salesAiInsights.keyTakeaways]}
                  onInsightClick={handleAIInsightClick}
                  title="AI Sales Intelligence"
                  icon={<Brain className="w-5 h-5 text-primary" />}
                  badge="Updated 1h ago"
                  actions={
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Regenerate
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-3 h-3 mr-1" />
                        Export Report
                      </Button>
                    </div>
                  }
                />
              </motion.div>
            </motion.div>
          )}

          {/* Product Performance Tab */}
          {activeTab === 'product-performance' && (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              {/* Global Filters */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Filters:</span>
                      </div>
                      <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Products</SelectItem>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="clothing">Clothing</SelectItem>
                          <SelectItem value="accessories">Accessories</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={refetch}
                        disabled={loading}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => realProductPerformanceData && handleExport(realProductPerformanceData.topProducts, 'product-performance', 'csv')}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* KPI Tiles */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-20 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <>
                    <ClickableKPICard
                      title="Top Product (Sales)"
                      value={realProductPerformanceData?.topProductBySales.name || 'N/A'}
                      change={`£${realProductPerformanceData?.topProductBySales.revenue.toLocaleString() || '0'}`}
                      changeType="positive"
                      icon={<Star className="w-5 h-5" />}
                      onClick={() => handleDrillThrough('product-sales', { product: realProductPerformanceData?.topProductBySales.name })}
                    />
                    <ClickableKPICard
                      title="Most Sold Product"
                      value={realProductPerformanceData?.mostSoldProduct.name || 'N/A'}
                      change={`${realProductPerformanceData?.mostSoldProduct.unitsSold.toLocaleString() || '0'} units`}
                      changeType="positive"
                      icon={<Package className="w-5 h-5" />}
                      onClick={() => handleDrillThrough('product-sales', { product: realProductPerformanceData?.mostSoldProduct.name })}
                    />
                    <ClickableKPICard
                      title="Highest AOV Product"
                      value={realProductPerformanceData?.highestAOVProduct.name || 'N/A'}
                      change={`£${realProductPerformanceData?.highestAOVProduct.aov.toFixed(2) || '0.00'} AOV`}
                      changeType="positive"
                      icon={<CreditCard className="w-5 h-5" />}
                      onClick={() => handleDrillThrough('product-sales', { product: realProductPerformanceData?.highestAOVProduct.name })}
                    />
                    <ClickableKPICard
                      title="Highest Refund Rate"
                      value={realProductPerformanceData?.highestRefundRateProduct.name || 'N/A'}
                      change={`${realProductPerformanceData?.highestRefundRateProduct.refundRate.toFixed(1) || '0.0'}% refunds`}
                      changeType="negative"
                      icon={<AlertTriangle className="w-5 h-5" />}
                      onClick={() => handleDrillThrough('refunds', { product: realProductPerformanceData?.highestRefundRateProduct.name })}
                    />
                  </>
                )}
              </div>

              {/* Top Products Table */}
              <ClickableTable
                title="Top Products Performance"
                icon={<Package className="w-5 h-5 text-primary" />}
                onExport={() => realProductPerformanceData && handleExport(realProductPerformanceData.topProducts, 'top-products', 'csv')}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Product</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total Revenue</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Orders</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Units Sold</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">AOV</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Refund Rate</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">First Ordered</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Last Ordered</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(realProductPerformanceData?.topProducts || []).map((product, index) => (
                        <tr 
                          key={index} 
                          className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleDrillThrough('product-sales', { product: product.product })}
                        >
                          <td className="py-3 px-4 font-medium">{product.product}</td>
                          <td className="text-right py-3 px-4">£{product.totalRevenue.toLocaleString()}</td>
                          <td className="text-right py-3 px-4">{product.orders.toLocaleString()}</td>
                          <td className="text-right py-3 px-4">{product.unitsSold.toLocaleString()}</td>
                          <td className="text-right py-3 px-4">£{product.aov.toFixed(2)}</td>
                          <td className="text-right py-3 px-4">
                            <span 
                              className={`${product.refundRate > 5 ? 'text-red-600' : 'text-muted-foreground'} cursor-pointer hover:underline`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDrillThrough('refunds', { product: product.product });
                              }}
                            >
                              {product.refundRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="text-right py-3 px-4 text-muted-foreground">
                            {new Date(product.firstOrdered).toLocaleDateString()}
                          </td>
                          <td className="text-right py-3 px-4 text-muted-foreground">
                            {new Date(product.lastOrdered).toLocaleDateString()}
                          </td>
                          <td className="text-right py-3 px-4">
                            <Sparkline data={product.trend} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ClickableTable>

              {/* Product Sales Trend Chart */}
              <ClickableChart
                title="Product Sales Trends"
                icon={<TrendingUp className="w-5 h-5 text-primary" />}
                onChartClick={(data) => handleDrillThrough('trends', { date: data?.activeLabel })}
                onDetailsClick={() => handleDrillThrough('trends')}
              >
                <div className="flex items-center justify-between mb-4">
                  <Select value={chartView} onValueChange={setChartView}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="quantity">Quantity</SelectItem>
                      <SelectItem value="orders">Orders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={realProductPerformanceData?.productTrendData || []}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    {realProductPerformanceData?.topProducts.slice(0, 5).map((product, index) => (
                      <Line
                        key={product.product}
                        type="monotone"
                        dataKey={product.product}
                        stroke={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'][index]}
                        strokeWidth={2}
                        name={product.product}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </ClickableChart>

              {/* Product Churn & Repurchase Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ClickableChart
                  title="Product Repurchase Rates"
                  icon={<UserCheck className="w-5 h-5 text-primary" />}
                  onChartClick={(data) => {
                    if (data && data.activeLabel) {
                      handleDrillThrough('retention', { product: data.activeLabel });
                    }
                  }}
                  onDetailsClick={() => handleDrillThrough('retention')}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={realProductPerformanceData?.productRepurchaseData || []}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="product" fontSize={12} angle={-45} textAnchor="end" height={80} />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: any) => [`${value.toFixed(1)}%`, 'Repurchase Rate']}
                      />
                      <Bar dataKey="repurchaseRate" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ClickableChart>

                <ClickableChart
                  title="Product Customer Segmentation"
                  icon={<Users className="w-5 h-5 text-primary" />}
                  onChartClick={(data) => {
                    if (data && data.activeLabel) {
                      handleDrillThrough('segment-analysis', { product: data.activeLabel });
                    }
                  }}
                  onDetailsClick={() => handleDrillThrough('segment-analysis')}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={realProductPerformanceData?.productSegmentData || []} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis type="number" fontSize={12} />
                      <YAxis dataKey="product" type="category" fontSize={12} width={120} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="newCustomers" stackId="a" fill="#3b82f6" name="New" />
                      <Bar dataKey="returningCustomers" stackId="a" fill="#10b981" name="Returning" />
                      <Bar dataKey="vipCustomers" stackId="a" fill="#f59e0b" name="VIP" />
                      <Bar dataKey="atRiskCustomers" stackId="a" fill="#ef4444" name="At Risk" />
                    </BarChart>
                  </ResponsiveContainer>
                </ClickableChart>
              </div>

              {/* AI-Powered Product Insights */}
              <motion.div variants={fadeInUp}>
                <ClickableAIInsights
                  insights={[
                    "Premium Wireless Headphones showing exceptional growth with 45% increase in repeat purchases, indicating strong customer satisfaction and brand loyalty.",
                    "Smart Fitness Tracker experiencing declining performance - consider product refresh or targeted marketing campaign to boost sales.",
                    "Organic Cotton T-Shirt has the highest repurchase rate at 84%, suggesting opportunity to expand sustainable clothing line.",
                    "Bluetooth Speaker showing concerning refund patterns - investigate quality control and customer feedback for improvements."
                  ]}
                  onInsightClick={handleAIInsightClick}
                  title="AI Product Intelligence"
                  icon={<Brain className="w-5 h-5 text-primary" />}
                  badge="Updated 2h ago"
                  actions={
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Regenerate
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-3 h-3 mr-1" />
                        Export Report
                      </Button>
                    </div>
                  }
                />
              </motion.div>
            </motion.div>
          )}

          {/* Churn & Retention Tab */}
          {activeTab === 'churn' && (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              {/* Churn Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  title="Current Churn Rate"
                  value="5.8%"
                  change="-19.4%"
                  icon={UserX}
                  trend="up"
                />
                <MetricCard
                  title="Customers at Risk"
                  value="24"
                  change="+8.3%"
                  icon={AlertTriangle}
                  trend="down"
                />
                <MetricCard
                  title="Retention Rate"
                  value="94.2%"
                  change="+1.4%"
                  icon={UserCheck}
                  trend="up"
                />
              </div>

              {/* Churn Trend Chart */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Churn Rate Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={churnData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="churnRate" stroke="#ef4444" strokeWidth={2} />
                        <Line type="monotone" dataKey="retained" stroke="#22c55e" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* At-Risk Customers */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                      High-Risk Customers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {atRiskCustomers.map((customer, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-sm text-muted-foreground">{customer.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <p className="text-sm font-medium">${customer.ltv} LTV</p>
                              <p className="text-xs text-muted-foreground">{customer.lastOrder}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-red-500 h-2 rounded-full" 
                                  style={{ width: `${customer.riskScore}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-red-500">{customer.riskScore}%</span>
                            </div>
                            <Button size="sm">
                              <Target className="w-4 h-4 mr-1" />
                              Target
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              {/* Product Performance */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topProducts.map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">{product.units} units sold</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-medium">${product.revenue.toLocaleString()}</p>
                              <div className="flex items-center">
                                {product.trend === 'up' ? (
                                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                ) : product.trend === 'down' ? (
                                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                                ) : (
                                  <Activity className="w-4 h-4 text-gray-500 mr-1" />
                                )}
                                <span className={`text-sm ${
                                  product.trend === 'up' ? 'text-green-500' : 
                                  product.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                                }`}>
                                  {product.trend === 'up' ? 'Growing' : 
                                   product.trend === 'down' ? 'Declining' : 'Stable'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* AI Predictions Tab */}
          {activeTab === 'predictions' && (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="w-5 h-5 mr-2 text-primary" />
                      AI Predictions & Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold">Revenue Forecast</h3>
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Next Month Prediction</span>
                            <Badge variant="secondary">95% Confidence</Badge>
                          </div>
                          <p className="text-2xl font-bold text-green-600">$72,500</p>
                          <p className="text-sm text-muted-foreground">+8.2% from current month</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="font-semibold">Churn Prediction</h3>
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Expected Churn Rate</span>
                            <Badge variant="secondary">92% Accuracy</Badge>
                          </div>
                          <p className="text-2xl font-bold text-orange-600">4.2%</p>
                          <p className="text-sm text-muted-foreground">-1.6% improvement expected</p>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <h3 className="font-semibold">Recommended Actions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-border rounded-lg">
                          <div className="flex items-center mb-2">
                            <Target className="w-5 h-5 text-blue-500 mr-2" />
                            <span className="font-medium">Retention Campaign</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Launch targeted email campaign for 24 at-risk customers
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-600">Est. Revenue: $8,400</span>
                            <Button size="sm">Launch</Button>
                          </div>
                        </div>

                        <div className="p-4 border border-border rounded-lg">
                          <div className="flex items-center mb-2">
                            <Package className="w-5 h-5 text-purple-500 mr-2" />
                            <span className="font-medium">Product Promotion</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Promote Wireless Earbuds to Champions segment
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-600">Est. Revenue: $12,200</span>
                            <Button size="sm">Create</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Drill-through Modal */}
      <DrillThroughModal
        isOpen={drillThroughModal.isOpen}
        onClose={() => setDrillThroughModal({ isOpen: false, data: null })}
        data={drillThroughModal.data}
      />
    </div>
  );
}