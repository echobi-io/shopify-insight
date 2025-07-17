import React, { useState, useCallback, useEffect, Suspense } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AlertCircle } from 'lucide-react'
import { EnhancedDrillThroughKPI } from '@/components/EnhancedDrillThroughKPI'
import { EnhancedDrillThroughChart } from '@/components/EnhancedDrillThroughChart'
import { EnhancedDrillThroughList } from '@/components/EnhancedDrillThroughList'
import { getKPIsOptimized, getPreviousYearKPIsOptimized, type KPIData } from '@/lib/fetchers/getKpisOptimized'
import { getProductData } from '@/lib/fetchers/getProductData'
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
import { getTopCustomersData, TopCustomer } from '@/lib/fetchers/getTopCustomersData'
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

  // Essential data fetchers only - reduce concurrent requests
  const kpiDataFetcher = useDataFetcher(kpiFetchFunction, {
    enabled: true,
    refetchOnWindowFocus: false,
    onError: (error) => console.error('❌ Error loading current KPIs:', error)
  })

  const previousYearKpiDataFetcher = useDataFetcher(previousYearKpiFetchFunction, {
    enabled: !!kpiDataFetcher.data, // Only fetch after KPIs load
    refetchOnWindowFocus: false,
    onError: (error) => console.error('❌ Error loading previous year KPIs:', error)
  })

  // Charts data fetcher
  const chartsDataFetcher = useDataFetcher(
    useCallback(async () => {
      try {
        const data = await getDashboardChartsData(MERCHANT_ID, filters, granularity as any)
        return {
          data,
          error: null,
          loading: false,
          success: true
        }
      } catch (error) {
        return {
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
          loading: false,
          success: false
        }
      }
    }, [filters, granularity]),
    {
      enabled: !!kpiDataFetcher.data, // Only fetch after KPIs load
      refetchOnWindowFocus: false,
      onError: (error) => console.error('❌ Error loading charts data:', error)
    }
  )

  // Products data fetcher
  const productsDataFetcher = useDataFetcher(
    useCallback(async () => {
      try {
        const data = await getProductData(filters, MERCHANT_ID)
        return {
          data,
          error: null,
          loading: false,
          success: true
        }
      } catch (error) {
        return {
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
          loading: false,
          success: false
        }
      }
    }, [filters]),
    {
      enabled: !!kpiDataFetcher.data, // Only fetch after KPIs load
      refetchOnWindowFocus: false,
      onError: (error) => console.error('❌ Error loading products data:', error)
    }
  )

  // Top customers data fetcher
  const topCustomersDataFetcher = useDataFetcher(
    useCallback(async () => {
      try {
        const data = await getTopCustomersData(filters.startDate, filters.endDate)
        return {
          data,
          error: null,
          loading: false,
          success: true
        }
      } catch (error) {
        return {
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
          loading: false,
          success: false
        }
      }
    }, [filters]),
    {
      enabled: !!kpiDataFetcher.data, // Only fetch after KPIs load
      refetchOnWindowFocus: false,
      onError: (error) => console.error('❌ Error loading top customers data:', error)
    }
  )

  // Sales origin data fetcher
  const salesOriginDataFetcher = useDataFetcher(
    useCallback(async () => {
      try {
        const data = await getSalesOriginData(MERCHANT_ID, filters)
        return {
          data,
          error: null,
          loading: false,
          success: true
        }
      } catch (error) {
        return {
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
          loading: false,
          success: false
        }
      }
    }, [filters]),
    {
      enabled: !!kpiDataFetcher.data, // Only fetch after KPIs load
      refetchOnWindowFocus: false,
      onError: (error) => console.error('❌ Error loading sales origin data:', error)
    }
  )

  // Settings data fetcher
  const settingsDataFetcher = useDataFetcher(
    useCallback(async () => {
      try {
        const data = await getSettings()
        return {
          data,
          error: null,
          loading: false,
          success: true
        }
      } catch (error) {
        return {
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
          loading: false,
          success: false
        }
      }
    }, []),
    {
      enabled: true,
      refetchOnWindowFocus: false,
      onError: (error) => console.error('❌ Error loading settings:', error)
    }
  )

  // Update currency when settings load
  useEffect(() => {
    if (settingsDataFetcher.data?.currency) {
      setCurrency(settingsDataFetcher.data.currency)
    }
  }, [settingsDataFetcher.data])

  // Extract data with fallbacks
  const kpiData = kpiDataFetcher.data
  const previousYearKpiData = previousYearKpiDataFetcher.data
  const productData = productsDataFetcher.data || []
  const chartsData = chartsDataFetcher.data || { dailyData: [], orderTimingData: [] }
  const dashboardChartData = chartsData.dailyData || []
  const orderTimingData = chartsData.orderTimingData || []
  const topCustomersData = topCustomersDataFetcher.data || []
  const salesOriginData = salesOriginDataFetcher.data || []

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
  const loading = kpiDataFetcher.loading || settingsDataFetcher.loading

  // Data will automatically refetch when memoized functions change due to filter changes
  // No manual refetch needed as the hooks will detect the function changes

  const handleRefresh = useCallback(() => {
    kpiDataFetcher.refetch()
    previousYearKpiDataFetcher.refetch()
    chartsDataFetcher.refetch()
    productsDataFetcher.refetch()
    topCustomersDataFetcher.refetch()
    salesOriginDataFetcher.refetch()
    settingsDataFetcher.refetch()
  }, [kpiDataFetcher, previousYearKpiDataFetcher, chartsDataFetcher, productsDataFetcher, topCustomersDataFetcher, salesOriginDataFetcher, settingsDataFetcher])

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

      {/* Enhanced KPI Cards with Drill-Through */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <EnhancedDrillThroughKPI
              data={{
                title: "Total Revenue",
                value: data.totalRevenue || 0,
                change: previousYearKpiData ? ((data.totalRevenue - previousYearKpiData.totalRevenue) / previousYearKpiData.totalRevenue) * 100 : undefined,
                changeType: previousYearKpiData && data.totalRevenue >= previousYearKpiData.totalRevenue ? 'increase' : 'decrease',
                icon: <DollarSign className="w-4 h-4" />,
                description: "Total revenue from completed orders"
              }}
              dateRange={filters}
              onRefresh={handleRefresh}
            />
            <EnhancedDrillThroughKPI
              data={{
                title: "Total Orders",
                value: data.totalOrders || 0,
                change: previousYearKpiData ? ((data.totalOrders - previousYearKpiData.totalOrders) / previousYearKpiData.totalOrders) * 100 : undefined,
                changeType: previousYearKpiData && data.totalOrders >= previousYearKpiData.totalOrders ? 'increase' : 'decrease',
                icon: <ShoppingCart className="w-4 h-4" />,
                description: "Number of completed orders"
              }}
              dateRange={filters}
              onRefresh={handleRefresh}
            />
            <EnhancedDrillThroughKPI
              data={{
                title: "Average Order Value",
                value: data.avgOrderValue || 0,
                change: previousYearKpiData ? ((data.avgOrderValue - previousYearKpiData.avgOrderValue) / previousYearKpiData.avgOrderValue) * 100 : undefined,
                changeType: previousYearKpiData && data.avgOrderValue >= previousYearKpiData.avgOrderValue ? 'increase' : 'decrease',
                icon: <Target className="w-4 h-4" />,
                description: "Average value per order"
              }}
              dateRange={filters}
              onRefresh={handleRefresh}
            />
            <EnhancedDrillThroughKPI
              data={{
                title: "New Customers",
                value: data.newCustomers || 0,
                change: previousYearKpiData ? ((data.newCustomers - previousYearKpiData.newCustomers) / previousYearKpiData.newCustomers) * 100 : undefined,
                changeType: previousYearKpiData && data.newCustomers >= previousYearKpiData.newCustomers ? 'increase' : 'decrease',
                icon: <Users className="w-4 h-4" />,
                description: "First-time customers acquired"
              }}
              dateRange={filters}
              onRefresh={handleRefresh}
            />
          </div>
        )}
      </DataStateWrapper>

      {/* Revenue & Orders Chart and Sales by Source - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue & Orders Chart - Half Width */}
        <div className="h-[550px]">
          <DataStateWrapper
            data={dashboardChartData}
            loading={chartsDataFetcher.loading}
            error={chartsDataFetcher.error}
            onRetry={() => chartsDataFetcher.refetch()}
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
              <EnhancedDrillThroughChart
                title="Revenue & Orders Performance"
                data={data.map(item => ({
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
            )}
          </DataStateWrapper>
        </div>

        {/* Sales by Source Chart - Half Width */}
        <div className="h-[550px]">
          <DataStateWrapper
            data={salesOriginData}
            loading={salesOriginDataFetcher.loading}
            error={salesOriginDataFetcher.error}
            onRetry={() => salesOriginDataFetcher.refetch()}
            loadingComponent={<ChartSkeleton />}
            isEmpty={(data) => !data || data.length === 0}
            emptyComponent={
              <EmptyState 
                title="No sales origin data available"
                description="No sales channel data found for the selected period"
                icon={<AlertCircle className="h-12 w-12 text-muted-foreground" />}
              />
            }
          >
            {(data) => (
              <SalesOriginChart
                data={data}
                currency={currency}
                loading={salesOriginDataFetcher.loading}
              />
            )}
          </DataStateWrapper>
        </div>
      </div>

      {/* Order Timing Analysis and Peak Hours - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Order Timing Analysis - Takes 2/3 width with increased height */}
        <div className="lg:col-span-2 h-[750px]">
          <DataStateWrapper
            data={orderTimingData}
            loading={chartsDataFetcher.loading}
            error={chartsDataFetcher.error}
            onRetry={() => chartsDataFetcher.refetch()}
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
              <EnhancedDrillThroughChart
                title="Order Timing Analysis"
                data={data
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
            )}
          </DataStateWrapper>
        </div>

        {/* Peak Hours Table - Takes 1/3 width with matching height */}
        <div className="lg:col-span-1 h-[750px]">
          {orderTimingData.length > 0 && (
            <ChartCard
              title="Peak Hours Insights"
              description="Busiest and quietest periods"
              className="card-minimal h-full"
            >
              <div className="h-full flex flex-col space-y-8">
                {/* Busiest Hours */}
                <div className="flex-1">
                  <h4 className="font-medium text-black mb-4 text-base">🔥 Busiest Hours</h4>
                  <div className="space-y-3">
                    {getBusiestHours(orderTimingData, 3).map((data, index) => (
                      <div key={data.hour} className="flex items-center justify-between py-3 px-4 bg-red-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <span className="font-medium text-black text-base">{getHourLabel(data.hour)}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-black text-base">{formatNumber(data.order_count)}</span>
                          <span className="text-sm text-gray-600 block">({data.percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quietest Hours */}
                <div className="flex-1">
                  <h4 className="font-medium text-black mb-4 text-base">😴 Quietest Hours</h4>
                  <div className="space-y-3">
                    {orderTimingData
                      .filter(data => data.order_count > 0)
                      .sort((a, b) => a.order_count - b.order_count)
                      .slice(0, 3)
                      .map((data, index) => (
                      <div key={data.hour} className="flex items-center justify-between py-3 px-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <span className="font-medium text-black text-base">{getHourLabel(data.hour)}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-black text-base">{formatNumber(data.order_count)}</span>
                          <span className="text-sm text-gray-600 block">({data.percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="border-t pt-6 mt-auto">
                  <div className="text-center">
                    <div className="text-base text-gray-600 mb-2">Total Orders</div>
                    <div className="font-semibold text-2xl text-black">
                      {formatNumber(orderTimingData.reduce((sum, item) => sum + item.order_count, 0))}
                    </div>
                  </div>
                </div>
              </div>
            </ChartCard>
          )}
        </div>
      </div>

      {/* Enhanced Top Products and Top Customers with Drill-Through */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 pt-4">
        {/* Enhanced Top Products */}
        <div className="h-[600px]">
          <DataStateWrapper
            data={productData}
            loading={productsDataFetcher.loading}
            error={productsDataFetcher.error}
            onRetry={() => productsDataFetcher.refetch()}
            loadingComponent={<ChartSkeleton />}
            isEmpty={(data) => !data || data.length === 0}
            emptyComponent={
              <EmptyState 
                title="No product data available"
                description="No product performance data found for the selected period"
                icon={<AlertCircle className="h-12 w-12 text-muted-foreground" />}
              />
            }
          >
            {(data) => (
              <EnhancedDrillThroughList
                title="Top 10 Products"
                items={data.slice(0, 10).map((product, index) => ({
                  id: `product-${index}`,
                  name: product.product,
                  value: product.revenue,
                  secondaryValue: product.unitsSold,
                  change: Math.random() * 20 - 10, // Mock change data - would need historical comparison
                  trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
                  metadata: {
                    unitsSold: product.unitsSold,
                    aov: product.aov || product.avgOrderValue,
                    refunds: product.refunds,
                    orderCount: product.orderCount,
                    customerCount: product.customerCount,
                    repeatOrderRate: product.repeatOrderRate
                  }
                }))}
                type="products"
                dateRange={filters}
              />
            )}
          </DataStateWrapper>
        </div>

        {/* Enhanced Top Customers */}
        <div className="h-[600px]">
          <DataStateWrapper
            data={topCustomersData}
            loading={topCustomersDataFetcher.loading}
            error={topCustomersDataFetcher.error}
            onRetry={() => topCustomersDataFetcher.refetch()}
            loadingComponent={<ChartSkeleton />}
            isEmpty={(data) => !data || data.length === 0}
            emptyComponent={
              <EmptyState 
                title="No customer data available"
                description="No customer data found for the selected period"
                icon={<AlertCircle className="h-12 w-12 text-muted-foreground" />}
              />
            }
          >
            {(data) => (
              <EnhancedDrillThroughList
                title="Top Customers"
                items={data.slice(0, 10).map((customer) => ({
                  id: customer.customer_id,
                  name: customer.customer_name,
                  value: customer.total_spent,
                  secondaryValue: customer.order_count,
                  change: Math.random() * 30 - 15, // Mock change data
                  trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
                  metadata: {
                    orderCount: customer.order_count,
                    avgOrderValue: customer.avg_order_value,
                    lastOrderDate: customer.last_order_date
                  }
                }))}
                type="customers"
                dateRange={filters}
              />
            )}
          </DataStateWrapper>
        </div>
      </div>

      {/* Enhanced Business Insights with Drill-Through */}
      <div className="mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              AI-Powered Business Insights
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Click on any insight for detailed analysis and actionable recommendations
            </p>
          </CardHeader>
          <CardContent>
            <BusinessInsights
              kpiData={kpiData}
              previousYearKpiData={previousYearKpiData}
              productData={productData}
              topCustomersData={topCustomersData}
              orderTimingData={orderTimingData}
              currency={currency}
              dateRange={filters}
            />
          </CardContent>
        </Card>
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