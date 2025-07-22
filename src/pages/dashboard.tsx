import React, { useState, useCallback, useEffect, Suspense } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AlertCircle } from 'lucide-react'
import { EnhancedDrillThroughKPI } from '@/components/EnhancedDrillThroughKPI'
import { EnhancedDrillThroughChart } from '@/components/EnhancedDrillThroughChart'
import { getKPIsOptimized, getPreviousYearKPIsOptimized, type KPIData } from '@/lib/fetchers/getKpisOptimized'
import { 
  getDashboardChartsData, 
  getHourLabel, 
  getBusiestHours,
  type DashboardChartData,
  type OrderTimingData
} from '@/lib/fetchers/getDashboardChartsData'
import { getSalesOriginData, type SalesOriginData } from '@/lib/fetchers/getSalesOriginData'
import { formatCurrency, getSettings, getInitialTimeframe } from '@/lib/utils/settingsUtils'
import { getDateRangeFromTimeframe, formatDateForSQL } from '@/lib/utils/dateUtils'

import { useDataFetcher } from '@/hooks/useDataFetcher'
import { 
  LoadingOverlay, 
  KPICardSkeleton, 
  ChartSkeleton, 
  ErrorState, 
  EmptyState,
  DataStateWrapper,
  ConnectionStatus
} from '@/components/ui/loading-states'
import AppLayout from '@/components/Layout/AppLayout'
import PageHeader from '@/components/Layout/PageHeader'
import PageFilters from '@/components/Layout/PageFilters'
import ChartCard from '@/components/Layout/ChartCard'
import HelpSection, { getDashboardHelpItems } from '@/components/HelpSection'
import BusinessInsights from '@/components/BusinessInsights'
import SalesOriginChart from '@/components/SalesOriginChart'
import { DollarSign, ShoppingCart, Target, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useShop } from '@/contexts/ShopContext'

interface ProductData {
  product: string
  unitsSold: number
  revenue: number
  aov: number
  refunds: number
  repeatOrderRate: number
  trend: number[]
}

const DashboardPage: React.FC = () => {
  // Mock shop context for demo purposes
  const shop = 'demo-store.myshopify.com'
  const isAuthenticated = true
  
  // Filter states
  const [timeframe, setTimeframe] = useState(getInitialTimeframe())
  const [granularity, setGranularity] = useState('monthly')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [currency, setCurrency] = useState('USD')

  // Calculate date filters - memoize to prevent recreation
  const filters = React.useMemo(() => {
    const dateRange = getDateRangeFromTimeframe(timeframe, customStartDate, customEndDate)
    return {
      startDate: formatDateForSQL(dateRange.startDate),
      endDate: formatDateForSQL(dateRange.endDate)
    }
  }, [timeframe, customStartDate, customEndDate])

  // Mock data for demonstration
  const mockKpiData = {
    totalRevenue: 124500,
    totalOrders: 2847,
    avgOrderValue: 43.75,
    newCustomers: 1429
  }

  const mockPreviousYearKpiData = {
    totalRevenue: 110000,
    totalOrders: 2500,
    avgOrderValue: 44.00,
    newCustomers: 1200
  }

  const mockDashboardChartData = [
    { date: '2024-01-01', total_revenue: 8500, total_orders: 195 },
    { date: '2024-01-02', total_revenue: 9200, total_orders: 210 },
    { date: '2024-01-03', total_revenue: 7800, total_orders: 178 },
    { date: '2024-01-04', total_revenue: 10500, total_orders: 240 },
    { date: '2024-01-05', total_revenue: 11200, total_orders: 256 },
    { date: '2024-01-06', total_revenue: 9800, total_orders: 224 },
    { date: '2024-01-07', total_revenue: 8900, total_orders: 203 },
    { date: '2024-01-08', total_revenue: 12100, total_orders: 276 },
    { date: '2024-01-09', total_revenue: 10800, total_orders: 247 },
    { date: '2024-01-10', total_revenue: 9500, total_orders: 217 }
  ]

  const mockOrderTimingData = [
    { hour: 9, order_count: 45, percentage: 8.2 },
    { hour: 10, order_count: 62, percentage: 11.3 },
    { hour: 11, order_count: 78, percentage: 14.2 },
    { hour: 12, order_count: 85, percentage: 15.5 },
    { hour: 13, order_count: 72, percentage: 13.1 },
    { hour: 14, order_count: 68, percentage: 12.4 },
    { hour: 15, order_count: 55, percentage: 10.0 },
    { hour: 16, order_count: 48, percentage: 8.7 },
    { hour: 17, order_count: 36, percentage: 6.6 }
  ]

  const mockSalesOriginData = [
    { source: 'Online Store', revenue: 85000, percentage: 68.3 },
    { source: 'Social Media', revenue: 25000, percentage: 20.1 },
    { source: 'Email Marketing', revenue: 10000, percentage: 8.0 },
    { source: 'Direct Traffic', revenue: 4500, percentage: 3.6 }
  ]

  // Extract data with mock fallbacks
  const kpiData = mockKpiData
  const previousYearKpiData = mockPreviousYearKpiData
  const dashboardChartData = mockDashboardChartData
  const orderTimingData = mockOrderTimingData
  const salesOriginData = mockSalesOriginData

  // Mock loading state
  const loading = false

  const handleRefresh = useCallback(() => {
    console.log('Refresh clicked - using mock data')
  }, [])

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  // No sync needed for demo
  const hasNoData = false
  
  return (
    <AppLayout loading={loading} loadingMessage="Loading dashboard data...">
      <ConnectionStatus />
      
      <PageHeader
        title="Dashboard"
        description={`Business performance overview for ${shop || 'your store'}`}
        onRefresh={handleRefresh}
        loading={loading}
        actions={
          <div className="flex items-center gap-4">
            <PageFilters
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onCustomStartDateChange={setCustomStartDate}
              onCustomEndDateChange={setCustomEndDate}
              granularity={granularity}
              onGranularityChange={setGranularity}
            />
          </div>
        }
      />

      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <EnhancedDrillThroughKPI
            data={{
              title: "Total Revenue",
              value: kpiData.totalRevenue || 0,
              change: previousYearKpiData ? ((kpiData.totalRevenue - previousYearKpiData.totalRevenue) / previousYearKpiData.totalRevenue) * 100 : undefined,
              changeType: previousYearKpiData && kpiData.totalRevenue >= previousYearKpiData.totalRevenue ? 'increase' : 'decrease',
              icon: <DollarSign className="w-4 h-4" />,
              description: "Total revenue from completed orders"
            }}
            dateRange={filters}
            onRefresh={handleRefresh}
          />
          <EnhancedDrillThroughKPI
            data={{
              title: "Total Orders",
              value: kpiData.totalOrders || 0,
              change: previousYearKpiData ? ((kpiData.totalOrders - previousYearKpiData.totalOrders) / previousYearKpiData.totalOrders) * 100 : undefined,
              changeType: previousYearKpiData && kpiData.totalOrders >= previousYearKpiData.totalOrders ? 'increase' : 'decrease',
              icon: <ShoppingCart className="w-4 h-4" />,
              description: "Number of completed orders"
            }}
            dateRange={filters}
            onRefresh={handleRefresh}
          />
          <EnhancedDrillThroughKPI
            data={{
              title: "Average Order Value",
              value: kpiData.avgOrderValue || 0,
              change: previousYearKpiData ? ((kpiData.avgOrderValue - previousYearKpiData.avgOrderValue) / previousYearKpiData.avgOrderValue) * 100 : undefined,
              changeType: previousYearKpiData && kpiData.avgOrderValue >= previousYearKpiData.avgOrderValue ? 'increase' : 'decrease',
              icon: <Target className="w-4 h-4" />,
              description: "Average value per order"
            }}
            dateRange={filters}
            onRefresh={handleRefresh}
          />
          <EnhancedDrillThroughKPI
            data={{
              title: "New Customers",
              value: kpiData.newCustomers || 0,
              change: previousYearKpiData ? ((kpiData.newCustomers - previousYearKpiData.newCustomers) / previousYearKpiData.newCustomers) * 100 : undefined,
              changeType: previousYearKpiData && kpiData.newCustomers >= previousYearKpiData.newCustomers ? 'increase' : 'decrease',
              icon: <Users className="w-4 h-4" />,
              description: "First-time customers acquired"
            }}
            dateRange={filters}
            onRefresh={handleRefresh}
          />
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[400px]">
            <EnhancedDrillThroughChart
              title="Revenue & Orders Performance"
              data={dashboardChartData.map(item => ({
                date: item.date,
                revenue: item.total_revenue || 0,
                orders: item.total_orders || 0,
                total_revenue: item.total_revenue || 0,
                total_orders: item.total_orders || 0,
                ...item
              }))}
              type="line"
              primaryKey="total_revenue"
              secondaryKey="total_orders"
              dateRange={filters}
            />
          </div>

          <ChartCard
            title="Sales by Source"
            description="Revenue breakdown by sales channel"
            hasData={salesOriginData.length > 0}
            noDataMessage="No sales channel data found for the selected period"
            noDataIcon={<AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />}
          >
            <div className="h-[400px]">
              <SalesOriginChart
                data={salesOriginData}
                currency={currency}
                loading={false}
              />
            </div>
          </ChartCard>
        </div>

        {/* Order Timing Analysis Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[350px]">
            <EnhancedDrillThroughChart
              title="Order Timing Analysis"
              data={orderTimingData
                .sort((a, b) => a.hour - b.hour)
                .map(item => ({
                  date: getHourLabel(item.hour),
                  orders: item.order_count || 0,
                  hour: item.hour,
                  percentage: item.percentage || 0,
                  ...item
                }))}
              type="area"
              primaryKey="order_count"
              dateRange={filters}
            />
          </div>

          <ChartCard
            title="Peak Hours Insights"
            description="Busiest and quietest periods"
            hasData={orderTimingData.length > 0}
            noDataMessage="No timing data available"
            noDataIcon={<AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />}
          >
            <div className="h-[350px] flex flex-col space-y-4">
              <div className="flex-1">
                <h4 className="font-medium text-black mb-3 text-sm">🔥 Busiest Hours</h4>
                <div className="space-y-2">
                  {getBusiestHours(orderTimingData, 3).map((data, index) => (
                    <div key={data.hour} className="flex items-center justify-between py-2 px-3 bg-red-50">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 bg-red-100 text-red-600 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="font-medium text-black text-sm">{getHourLabel(data.hour)}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-black text-sm">{formatNumber(data.order_count)}</span>
                        <span className="text-xs text-gray-600 block">({data.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1">
                <h4 className="font-medium text-black mb-3 text-sm">😴 Quietest Hours</h4>
                <div className="space-y-2">
                  {orderTimingData
                    .filter(data => data.order_count > 0)
                    .sort((a, b) => a.order_count - b.order_count)
                    .slice(0, 3)
                    .map((data, index) => (
                    <div key={data.hour} className="flex items-center justify-between py-2 px-3 bg-blue-50">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="font-medium text-black text-sm">{getHourLabel(data.hour)}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-black text-sm">{formatNumber(data.order_count)}</span>
                        <span className="text-xs text-gray-600 block">({data.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3 mt-auto">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Total Orders</div>
                  <div className="font-semibold text-lg text-black">
                    {formatNumber(orderTimingData.reduce((sum, item) => sum + item.order_count, 0))}
                  </div>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* AI-Powered Business Insights */}
        <ChartCard
          title="AI-Powered Business Insights"
          description="Click on any insight for detailed analysis and actionable recommendations"
        >
          <BusinessInsights
            kpiData={kpiData}
            previousYearKpiData={previousYearKpiData}
            productData={[]}
            topCustomersData={[]}
            orderTimingData={orderTimingData}
            currency={currency}
            dateRange={filters}
          />
        </ChartCard>

        {/* Help Section */}
        <HelpSection 
          title="Dashboard Help & Information"
          items={getDashboardHelpItems()}
          defaultOpen={false}
        />
      </div>
    </AppLayout>
  )
}

export default DashboardPage