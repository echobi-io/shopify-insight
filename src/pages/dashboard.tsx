import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { AlertCircle } from 'lucide-react'
import { getKPIs, getPreviousYearKPIs, type KPIData } from '@/lib/fetchers/getKpis'
import { getProductData } from '@/lib/fetchers/getProductData'
import { getAllDashboardData, type DashboardKPIs, type DashboardTrendData, type CustomerSegmentData, type AICommentaryData } from '@/lib/fetchers/getDashboardData'
import { 
  getDailyRevenueBreakdown, 
  getOrdersByProduct, 
  getNewCustomersDetail, 
  getAOVStats,
  type DailyRevenueData,
  type OrdersByProductData,
  type NewCustomerData,
  type AOVStatsData
} from '@/lib/fetchers/getDetailedKPIData'
import { 
  getDashboardChartsData, 
  getHourLabel, 
  getBusiestHours,
  type DashboardChartData,
  type OrderTimingData
} from '@/lib/fetchers/getDashboardChartsData'
import { formatCurrency, getSettings } from '@/lib/utils/settingsUtils'
import { getTopCustomersData, TopCustomer } from '@/lib/fetchers/getTopCustomersData'
import AppLayout from '@/components/Layout/AppLayout'
import PageHeader from '@/components/Layout/PageHeader'
import PageFilters from '@/components/Layout/PageFilters'
import KPIGrid from '@/components/Layout/KPIGrid'
import ChartCard from '@/components/Layout/ChartCard'
import HelpSection, { getDashboardHelpItems } from '@/components/HelpSection'
import { TopCustomersSection } from '@/components/TopCustomersSection'
import { SupabaseDiagnostic } from '@/components/SupabaseDiagnostic'
import { usePageState } from '@/hooks/usePageState'

const MERCHANT_ID = '11111111-1111-1111-1111-111111111111'

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
  // Data states
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [previousYearKpiData, setPreviousYearKpiData] = useState<KPIData | null>(null)
  const [productData, setProductData] = useState<ProductData[]>([])
  const [dashboardChartData, setDashboardChartData] = useState<DashboardChartData[]>([])
  const [orderTimingData, setOrderTimingData] = useState<OrderTimingData[]>([])
  const [dailyRevenueData, setDailyRevenueData] = useState<DailyRevenueData[]>([])
  const [ordersByProductData, setOrdersByProductData] = useState<OrdersByProductData[]>([])
  const [newCustomersData, setNewCustomersData] = useState<NewCustomerData[]>([])
  const [aovStatsData, setAovStatsData] = useState<AOVStatsData[]>([])
  const [topCustomersData, setTopCustomersData] = useState<TopCustomer[]>([])
  const [currency, setCurrency] = useState('GBP')

  // Use the page state hook
  const {
    timeframe,
    setTimeframe,
    granularity,
    setGranularity,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    loading,
    loadData
  } = usePageState({
    onDataLoad: async (filters, granularityParam) => {
      console.log('🔄 Loading dashboard data for timeframe:', timeframe)

      // Load all data in parallel
      const [
        currentKpis, 
        previousYearKpis, 
        products, 
        chartsData,
        dailyRevenue,
        ordersByProduct,
        newCustomers,
        aovStats,
        topCustomers,
        settings
      ] = await Promise.all([
        getKPIs(filters, MERCHANT_ID).catch(err => {
          console.error('❌ Error loading current KPIs:', err)
          return null
        }),
        getPreviousYearKPIs(filters, MERCHANT_ID).catch(err => {
          console.error('❌ Error loading previous year KPIs:', err)
          return null
        }),
        getProductData(filters, MERCHANT_ID),
        getDashboardChartsData(MERCHANT_ID, filters, granularityParam as any).catch(err => {
          console.error('❌ Error loading dashboard charts data:', err)
          return { dailyData: [], orderTimingData: [] }
        }),
        getDailyRevenueBreakdown(MERCHANT_ID, filters).catch(err => {
          console.error('❌ Error loading daily revenue data:', err)
          return []
        }),
        getOrdersByProduct(MERCHANT_ID, filters).catch(err => {
          console.error('❌ Error loading orders by product data:', err)
          return []
        }),
        getNewCustomersDetail(MERCHANT_ID, filters).catch(err => {
          console.error('❌ Error loading new customers data:', err)
          return []
        }),
        getAOVStats(MERCHANT_ID, filters).catch(err => {
          console.error('❌ Error loading AOV stats data:', err)
          return []
        }),
        getTopCustomersData(filters.startDate, filters.endDate).catch(err => {
          console.error('❌ Error loading top customers data:', err)
          return []
        }),
        getSettings().catch(err => {
          console.error('❌ Error loading settings:', err)
          return { currency: 'GBP' }
        })
      ])

      setKpiData(currentKpis)
      setPreviousYearKpiData(previousYearKpis)
      setProductData(products)
      setDashboardChartData(chartsData.dailyData)
      setOrderTimingData(chartsData.orderTimingData)
      setDailyRevenueData(dailyRevenue)
      setOrdersByProductData(ordersByProduct)
      setNewCustomersData(newCustomers)
      setAovStatsData(aovStats)
      setTopCustomersData(topCustomers)
      setCurrency(settings.currency || 'GBP')
    }
  })

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  return (
    <AppLayout loading={loading} loadingMessage="Loading dashboard data...">
      <PageHeader
        title="Dashboard"
        description="Business performance overview"
        onRefresh={loadData}
        loading={loading}
        actions={
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
        }
      />

      {/* KPI Cards */}
      <KPIGrid
        currentKpis={kpiData}
        previousKpis={previousYearKpiData}
        variant="detailed"
        detailedData={{
          revenue: dailyRevenueData,
          orders: ordersByProductData,
          customers: newCustomersData,
          aov: aovStatsData
        }}
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Combined Revenue & Orders Chart */}
        <ChartCard
          title="Revenue & Orders Trend"
          description={`${granularity.charAt(0).toUpperCase() + granularity.slice(1)} performance overview`}
          hasData={dashboardChartData.length > 0}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  stroke="#666"
                  tickFormatter={(value) => {
                    if (granularity === 'daily') {
                      return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    } else if (granularity === 'weekly') {
                      return value.replace('Week of ', '')
                    } else if (granularity === 'monthly') {
                      const [year, month] = value.split('-')
                      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                    } else if (granularity === 'quarterly') {
                      return value
                    } else if (granularity === 'yearly') {
                      return value
                    }
                    return value
                  }}
                />
                <YAxis yAxisId="revenue" orientation="left" fontSize={12} stroke="#3b82f6" />
                <YAxis yAxisId="orders" orientation="right" fontSize={12} stroke="#10b981" />
                <Tooltip 
                  labelFormatter={(value) => {
                    if (granularity === 'daily') {
                      return new Date(value).toLocaleDateString()
                    } else if (granularity === 'weekly') {
                      return value
                    } else if (granularity === 'monthly') {
                      const [year, month] = value.split('-')
                      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    } else if (granularity === 'quarterly') {
                      return value
                    } else if (granularity === 'yearly') {
                      return value
                    }
                    return value
                  }}
                  formatter={(value: any, name: string) => [
                    name === 'total_revenue' ? formatCurrency(value) : formatNumber(value),
                    name === 'total_revenue' ? 'Revenue' : 'Orders'
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0',
                    fontSize: '14px'
                  }}
                />
                <Line 
                  yAxisId="revenue"
                  type="monotone" 
                  dataKey="total_revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  name="Revenue"
                />
                <Line 
                  yAxisId="orders"
                  type="monotone" 
                  dataKey="total_orders" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Order Timing Analysis */}
        <ChartCard
          title="Order Timing Analysis"
          description="When your site is busiest (orders by hour)"
          hasData={orderTimingData.length > 0}
          noDataMessage="No timing data available"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderTimingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="hour" 
                  fontSize={12}
                  stroke="#666"
                  tickFormatter={(value) => getHourLabel(value)}
                  type="number"
                  domain={[0, 23]}
                  ticks={[0, 6, 12, 18, 23]}
                />
                <YAxis fontSize={12} stroke="#666" />
                <Tooltip 
                  labelFormatter={(value) => `${getHourLabel(value)}`}
                  formatter={(value: any, name: string) => [
                    formatNumber(value),
                    name === 'order_count' ? 'Orders' : name
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0',
                    fontSize: '14px'
                  }}
                />
                <Bar 
                  dataKey="order_count" 
                  fill="#8b5cf6"
                  name="Orders"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Order Timing Insights */}
      {orderTimingData.length > 0 && (
        <ChartCard
          title="Peak Hours Insights"
          description="Understanding your busiest and quietest periods"
          className="card-minimal mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Busiest Hours */}
            <div>
              <h4 className="font-medium text-black mb-3">🔥 Busiest Hours</h4>
              <div className="space-y-2">
                {getBusiestHours(orderTimingData, 3).map((data, index) => (
                  <div key={data.hour} className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium text-black">{getHourLabel(data.hour)}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-black">{formatNumber(data.order_count)} orders</span>
                      <span className="text-xs text-gray-600 ml-2">({data.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quietest Hours */}
            <div>
              <h4 className="font-medium text-black mb-3">😴 Quietest Hours</h4>
              <div className="space-y-2">
                {orderTimingData
                  .filter(data => data.order_count > 0)
                  .sort((a, b) => a.order_count - b.order_count)
                  .slice(0, 3)
                  .map((data, index) => (
                  <div key={data.hour} className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium text-black">{getHourLabel(data.hour)}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-black">{formatNumber(data.order_count)} orders</span>
                      <span className="text-xs text-gray-600 ml-2">({data.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ChartCard>
      )}

      {/* Top Products and Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Products */}
        <ChartCard
          title="Top Products"
          description="Best performing products by revenue"
          hasData={productData.length > 0}
          noDataMessage="No product data available"
        >
          <div className="space-y-4">
            {productData.slice(0, 5).map((product, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-black">{product.product}</p>
                    <p className="text-sm font-light text-gray-600">
                      {formatNumber(product.unitsSold)} units sold
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-black">
                    {formatCurrency(product.revenue)}
                  </p>
                  <p className="text-sm font-light text-gray-600">
                    {formatCurrency(product.aov)} AOV
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Top Customers */}
        <div className="card-minimal">
          <TopCustomersSection
            customers={topCustomersData}
            isLoading={loading}
            currency={currency}
          />
        </div>
      </div>

      {/* Supabase Diagnostic - Temporary */}
      <div className="mb-8">
        <SupabaseDiagnostic />
      </div>

      {/* Help Section */}
      <HelpSection 
        title="Dashboard Help & Information"
        items={getDashboardHelpItems()}
        defaultOpen={false}
      />
    </AppLayout>
  )
}

export default DashboardPage