import React, { useState, useCallback, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AlertCircle } from 'lucide-react'
import SimpleRevenueChart from '@/components/SimpleRevenueChart'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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

  // Calculate date filters - memoize to prevent recreation
  const filters = React.useMemo(() => {
    const dateRange = getDateRangeFromTimeframe(timeframe, customStartDate, customEndDate)
    return {
      startDate: formatDateForSQL(dateRange.startDate),
      endDate: formatDateForSQL(dateRange.endDate)
    }
  }, [timeframe, customStartDate, customEndDate])

  // Memoize fetch functions to prevent recreation on every render
  const kpiFetchFunction = useCallback(() => {
    return getKPIsOptimized(filters, MERCHANT_ID, {
      cacheKey: `kpis_${MERCHANT_ID}_${filters.startDate}_${filters.endDate}`,
      timeout: 20000,
      retries: 3
    })
  }, [filters])

  const previousYearKpiFetchFunction = useCallback(() => {
    return getPreviousYearKPIsOptimized(filters, MERCHANT_ID, {
      cacheKey: `kpis_py_${MERCHANT_ID}_${filters.startDate}_${filters.endDate}`,
      timeout: 20000,
      retries: 3
    })
  }, [filters])

  // Memoize dashboard fetchers object
  const dashboardFetchers = React.useMemo(() => ({
    products: () => getProductData(filters, MERCHANT_ID).then(data => ({ data, error: null, success: true, loading: false })).catch(error => ({ data: [], error, success: false, loading: false })),
    chartsData: () => getDashboardChartsData(MERCHANT_ID, filters, granularity as any).then(data => ({ data, error: null, success: true, loading: false })).catch(error => ({ data: { dailyData: [], orderTimingData: [] }, error, success: false, loading: false })),
    dailyRevenue: () => getDailyRevenueBreakdown(MERCHANT_ID, filters).then(data => ({ data, error: null, success: true, loading: false })).catch(error => ({ data: [], error, success: false, loading: false })),
    ordersByProduct: () => getOrdersByProduct(MERCHANT_ID, filters).then(data => ({ data, error: null, success: true, loading: false })).catch(error => ({ data: [], error, success: false, loading: false })),
    newCustomers: () => getNewCustomersDetail(MERCHANT_ID, filters).then(data => ({ data, error: null, success: true, loading: false })).catch(error => ({ data: [], error, success: false, loading: false })),
    aovStats: () => getAOVStats(MERCHANT_ID, filters).then(data => ({ data, error: null, success: true, loading: false })).catch(error => ({ data: [], error, success: false, loading: false })),
    topCustomers: () => getTopCustomersData(filters.startDate, filters.endDate).then(data => ({ data, error: null, success: true, loading: false })).catch(error => ({ data: [], error, success: false, loading: false })),
    settings: () => getSettings().then(data => ({ data, error: null, success: true, loading: false })).catch(error => ({ data: { currency: 'GBP' }, error, success: false, loading: false }))
  }), [filters, granularity])

  // Optimized data fetching with proper error handling and loading states
  const kpiDataFetcher = useDataFetcher(kpiFetchFunction, {
    enabled: true,
    refetchOnWindowFocus: false,
    onError: (error) => console.error('❌ Error loading current KPIs:', error)
  })

  const previousYearKpiDataFetcher = useDataFetcher(previousYearKpiFetchFunction, {
    enabled: true,
    refetchOnWindowFocus: false,
    onError: (error) => console.error('❌ Error loading previous year KPIs:', error)
  })

  // Multiple data fetchers for dashboard components
  const dashboardDataFetchers = useMultipleDataFetchers(dashboardFetchers, {
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

  // Debug KPI data
  console.log('🎯 Dashboard KPI Debug:', {
    kpiDataExists: !!kpiData,
    kpiData: kpiData,
    kpiDataFetcherLoading: kpiDataFetcher.loading,
    kpiDataFetcherError: kpiDataFetcher.error,
    previousYearKpiDataExists: !!previousYearKpiData,
    previousYearKpiData: previousYearKpiData
  })

  // Debug chart data
  console.log('📊 Dashboard Chart Debug:', {
    chartsDataExists: !!chartsData,
    dashboardChartDataLength: dashboardChartData.length,
    dashboardChartData: dashboardChartData.slice(0, 3),
    orderTimingDataLength: orderTimingData.length
  })



  // Global loading state
  const loading = kpiDataFetcher.loading || previousYearKpiDataFetcher.loading || dashboardDataFetchers.globalLoading

  // Data will automatically refetch when memoized functions change due to filter changes
  // No manual refetch needed as the hooks will detect the function changes

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
        {/* New Enhanced Revenue & Orders Chart */}
        <div className="w-full">
          {dashboardDataFetchers.results.chartsData?.error ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  Chart Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Failed to load chart data: {dashboardDataFetchers.results.chartsData.error.message}
                </p>
                <Button 
                  onClick={() => dashboardDataFetchers.refetchAll()}
                  variant="outline"
                  size="sm"
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <SimpleRevenueChart
              data={dashboardChartData}
              granularity={granularity}
              currency={currency}
              loading={dashboardDataFetchers.results.chartsData?.loading || false}
            />
          )}
        </div>

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