import React, { useState, useCallback, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { AlertCircle } from 'lucide-react'
import { getKPIsOptimized, getPreviousYearKPIsOptimized, type KPIData } from '@/lib/fetchers/getKpisOptimized'
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
import { formatCurrency, getSettings, getInitialTimeframe } from '@/lib/utils/settingsUtils'
import { getDateRangeFromTimeframe, formatDateForSQL } from '@/lib/utils/dateUtils'
import { getTopCustomersData, TopCustomer } from '@/lib/fetchers/getTopCustomersData'
import { useDataFetcher, useMultipleDataFetchers } from '@/hooks/useDataFetcher'
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
import KPIGrid from '@/components/Layout/KPIGrid'
import ChartCard from '@/components/Layout/ChartCard'
import HelpSection, { getDashboardHelpItems } from '@/components/HelpSection'
import { TopItemsSection } from '@/components/TopItemsSection'
import { SupabaseDiagnostic } from '@/components/SupabaseDiagnostic'

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
  // Filter states
  const [timeframe, setTimeframe] = useState(getInitialTimeframe())
  const [granularity, setGranularity] = useState('monthly')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [currency, setCurrency] = useState('GBP')

  // Calculate date filters
  const dateRange = getDateRangeFromTimeframe(timeframe, customStartDate, customEndDate)
  const filters = {
    startDate: formatDateForSQL(dateRange.startDate),
    endDate: formatDateForSQL(dateRange.endDate)
  }

  // Optimized data fetching with proper error handling and loading states
  const kpiDataFetcher = useDataFetcher(
    () => getKPIsOptimized(filters, MERCHANT_ID, {
      cacheKey: `kpis_${MERCHANT_ID}_${filters.startDate}_${filters.endDate}`,
      timeout: 20000,
      retries: 3
    }).then(result => result),
    {
      enabled: true,
      refetchOnWindowFocus: false,
      onError: (error) => console.error('❌ Error loading current KPIs:', error)
    }
  )

  const previousYearKpiDataFetcher = useDataFetcher(
    () => getPreviousYearKPIsOptimized(filters, MERCHANT_ID, {
      cacheKey: `kpis_py_${MERCHANT_ID}_${filters.startDate}_${filters.endDate}`,
      timeout: 20000,
      retries: 3
    }).then(result => result),
    {
      enabled: true,
      refetchOnWindowFocus: false,
      onError: (error) => console.error('❌ Error loading previous year KPIs:', error)
    }
  )

  // Multiple data fetchers for dashboard components
  const dashboardDataFetchers = useMultipleDataFetchers({
    products: () => getProductData(filters, MERCHANT_ID).then(data => ({ data, error: null, success: true, loading: false })).catch(error => ({ data: [], error, success: false, loading: false })),
    chartsData: () => getDashboardChartsData(MERCHANT_ID, filters, granularity as any).then(data => ({ data, error: null, success: true, loading: false })).catch(error => ({ data: { dailyData: [], orderTimingData: [] }, error, success: false, loading: false })),
    dailyRevenue: () => getDailyRevenueBreakdown(MERCHANT_ID, filters).then(data => ({ data, error: null, success: true, loading: false })).catch(error => ({ data: [], error, success: false, loading: false })),
    ordersByProduct: () => getOrdersByProduct(MERCHANT_ID, filters).then(data => ({ data, error: null, success: true, loading: false })).catch(error => ({ data: [], error, success: false, loading: false })),
    newCustomers: () => getNewCustomersDetail(MERCHANT_ID, filters).then(data => ({ data, error: null, success: true, loading: false })).catch(error => ({ data: [], error, success: false, loading: false })),
    aovStats: () => getAOVStats(MERCHANT_ID, filters).then(data => ({ data, error: null, success: true, loading: false })).catch(error => ({ data: [], error, success: false, loading: false })),
    topCustomers: () => getTopCustomersData(filters.startDate, filters.endDate).then(data => ({ data, error: null, success: true, loading: false })).catch(error => ({ data: [], error, success: false, loading: false })),
    settings: () => getSettings().then(data => ({ data, error: null, success: true, loading: false })).catch(error => ({ data: { currency: 'GBP' }, error, success: false, loading: false }))
  }, {
    enabled: true,
    onError: (error) => console.error('❌ Error loading dashboard data:', error)
  })

  // Update currency when settings load
  useEffect(() => {
    if (dashboardDataFetchers.results.settings?.data?.currency) {
      setCurrency(dashboardDataFetchers.results.settings.data.currency)
    }
  }, [dashboardDataFetchers.results.settings?.data])

  // Extract data with fallbacks
  const kpiData = kpiDataFetcher.data
  const previousYearKpiData = previousYearKpiDataFetcher.data
  const productData = dashboardDataFetchers.results.products?.data || []
  const chartsData = dashboardDataFetchers.results.chartsData?.data || { dailyData: [], orderTimingData: [] }
  const dashboardChartData = chartsData.dailyData || []
  const orderTimingData = chartsData.orderTimingData || []
  const dailyRevenueData = dashboardDataFetchers.results.dailyRevenue?.data || []
  const ordersByProductData = dashboardDataFetchers.results.ordersByProduct?.data || []
  const newCustomersData = dashboardDataFetchers.results.newCustomers?.data || []
  const aovStatsData = dashboardDataFetchers.results.aovStats?.data || []
  const topCustomersData = dashboardDataFetchers.results.topCustomers?.data || []

  // Global loading state
  const loading = kpiDataFetcher.loading || previousYearKpiDataFetcher.loading || dashboardDataFetchers.globalLoading

  // Refetch all data when filters change
  useEffect(() => {
    kpiDataFetcher.refetch()
    previousYearKpiDataFetcher.refetch()
    dashboardDataFetchers.refetchAll()
  }, [timeframe, granularity, customStartDate, customEndDate])

  const handleRefresh = useCallback(() => {
    kpiDataFetcher.refetch()
    previousYearKpiDataFetcher.refetch()
    dashboardDataFetchers.refetchAll()
  }, [kpiDataFetcher, previousYearKpiDataFetcher, dashboardDataFetchers])

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  return (
    <AppLayout loading={loading} loadingMessage="Loading dashboard data...">
      <ConnectionStatus />
      
      <PageHeader
        title="Dashboard"
        description="Business performance overview"
        onRefresh={handleRefresh}
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

      {/* KPI Cards with Loading States */}
      <DataStateWrapper
        data={kpiData}
        loading={kpiDataFetcher.loading}
        error={kpiDataFetcher.error}
        onRetry={kpiDataFetcher.refetch}
        loadingComponent={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <KPICardSkeleton key={i} />
            ))}
          </div>
        }
        errorComponent={
          <ErrorState 
            error={kpiDataFetcher.error!} 
            onRetry={kpiDataFetcher.refetch}
            title="Failed to load KPI data"
            description="Unable to fetch key performance indicators"
            showDetails={true}
          />
        }
        className="mb-8"
      >
        {(data) => (
          <KPIGrid
            currentKpis={data}
            previousKpis={previousYearKpiData}
            variant="detailed"
            detailedData={{
              revenue: dailyRevenueData,
              orders: ordersByProductData,
              customers: newCustomersData,
              aov: aovStatsData
            }}
          />
        )}
      </DataStateWrapper>

      {/* Charts with Loading States */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Combined Revenue & Orders Chart */}
        <DataStateWrapper
          data={dashboardChartData}
          loading={dashboardDataFetchers.results.chartsData?.loading || false}
          error={dashboardDataFetchers.results.chartsData?.error || null}
          onRetry={() => dashboardDataFetchers.refetchAll()}
          loadingComponent={<ChartSkeleton />}
          isEmpty={(data) => !data || data.length === 0}
          emptyComponent={
            <EmptyState 
              title="No chart data available"
              description="No revenue or order data found for the selected period"
              icon={<AlertCircle className="h-12 w-12 text-muted-foreground" />}
            />
          }
        >
          {(data) => (
            <ChartCard
              title="Revenue & Orders Trend"
              description={`${granularity.charAt(0).toUpperCase() + granularity.slice(1)} performance overview`}
              hasData={data.length > 0}
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
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
          )}
        </DataStateWrapper>

        {/* Order Timing Analysis */}
        <DataStateWrapper
          data={orderTimingData}
          loading={dashboardDataFetchers.results.chartsData?.loading || false}
          error={dashboardDataFetchers.results.chartsData?.error || null}
          onRetry={() => dashboardDataFetchers.refetchAll()}
          loadingComponent={<ChartSkeleton />}
          isEmpty={(data) => !data || data.length === 0}
          emptyComponent={
            <EmptyState 
              title="No timing data available"
              description="No order timing data found for the selected period"
              icon={<AlertCircle className="h-12 w-12 text-muted-foreground" />}
            />
          }
        >
          {(data) => (
            <ChartCard
              title="Order Timing Analysis"
              description="When your site is busiest (orders by hour)"
              hasData={data.length > 0}
              noDataMessage="No timing data available"
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
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
          )}
        </DataStateWrapper>
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
        <TopItemsSection
          title="Top Products"
          description="Best performing products by revenue"
          items={productData.map((product, index) => ({
            id: `product-${index}`,
            name: product.product,
            primaryValue: product.revenue,
            secondaryValue: product.aov,
            primaryLabel: "Revenue",
            secondaryLabel: "AOV",
            additionalInfo: formatNumber(product.unitsSold),
            additionalLabel: "units sold"
          }))}
          isLoading={loading}
          currency={currency}
          showCount={5}
          loadCount={10}
        />

        {/* Top Customers */}
        <TopItemsSection
          title="Top Customers"
          description="Highest value customers by total spent"
          items={topCustomersData.map((customer) => ({
            id: customer.customer_id,
            name: customer.customer_name,
            primaryValue: customer.total_spent,
            secondaryValue: customer.avg_order_value,
            primaryLabel: "Total Spent",
            secondaryLabel: "AOV",
            additionalInfo: customer.order_count.toString(),
            additionalLabel: "orders"
          }))}
          isLoading={loading}
          currency={currency}
          showCount={5}
          loadCount={10}
        />
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