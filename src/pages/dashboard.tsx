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
  const chartsData = chartsDataFetcher.data || { dailyData: [], orderTimingData: [] }
  const dashboardChartData = chartsData.dailyData || []
  const orderTimingData = chartsData.orderTimingData || []
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
    salesOriginDataFetcher.refetch()
    settingsDataFetcher.refetch()
  }, [kpiDataFetcher, previousYearKpiDataFetcher, chartsDataFetcher, salesOriginDataFetcher, settingsDataFetcher])

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

      <div className="space-y-6">
        {/* Enhanced KPI Cards with Drill-Through */}
        <DataStateWrapper
          data={kpiData}
          loading={kpiDataFetcher.loading}
          error={kpiDataFetcher.error}
          onRetry={kpiDataFetcher.refetch}
          loadingComponent={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        >
          {(data) => (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue & Orders Chart */}
          <ChartCard
            title="Revenue & Orders Performance"
            description="Track revenue and order volume trends"
            hasData={dashboardChartData.length > 0}
            noDataMessage="No revenue or order data found for the selected period"
            noDataIcon={<AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />}
          >
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
          </ChartCard>

          {/* Sales by Source Chart */}
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
                loading={salesOriginDataFetcher.loading}
              />
            </div>
          </ChartCard>
        </div>

        {/* Order Timing Analysis Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Timing Analysis */}
          <ChartCard
            title="Order Timing Analysis"
            description="Hourly order distribution patterns"
            hasData={orderTimingData.length > 0}
            noDataMessage="No order timing data found for the selected period"
            noDataIcon={<AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />}
          >
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
            </ChartCard>

          {/* Peak Hours Insights */}
          <ChartCard
            title="Peak Hours Insights"
            description="Busiest and quietest periods"
            hasData={orderTimingData.length > 0}
            noDataMessage="No timing data available"
            noDataIcon={<AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />}
          >
            <div className="h-[350px] flex flex-col space-y-4">
                {/* Busiest Hours */}
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

                {/* Quietest Hours */}
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

                {/* Summary Stats */}
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



        {/* Enhanced Business Insights */}
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