import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, RefreshCw, AlertCircle } from 'lucide-react'
import { getKPIs, getPreviousYearKPIs, calculateKPIChanges, type KPIData, type FilterState } from '@/lib/fetchers/getKpis'
import { getRevenueByDate, type RevenueByDateData } from '@/lib/fetchers/getRevenueByDate'
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
import { getDateRangeFromTimeframe, formatDateForSQL } from '@/lib/utils/dateUtils'
import { formatCurrency, getInitialTimeframe, getSettings } from '@/lib/utils/settingsUtils'
import { getTopCustomersData, TopCustomer } from '@/lib/fetchers/getTopCustomersData'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import ProtectedRoute from '@/components/ProtectedRoute'
import DetailedKPICard from '@/components/DetailedKPICard'
import DateRangeSelector from '@/components/DateRangeSelector'
import HelpSection, { getDashboardHelpItems } from '@/components/HelpSection'
import { TopCustomersSection } from '@/components/TopCustomersSection'
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
  const [timeframe, setTimeframe] = useState(getInitialTimeframe() || 'financial_current')
  const [loading, setLoading] = useState(true)
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [previousYearKpiData, setPreviousYearKpiData] = useState<KPIData | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueByDateData[]>([])
  const [productData, setProductData] = useState<ProductData[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  
  // Dashboard-specific state
  const [dashboardKpis, setDashboardKpis] = useState<DashboardKPIs | null>(null)
  const [dashboardTrendData, setDashboardTrendData] = useState<DashboardTrendData[]>([])
  const [segmentData, setSegmentData] = useState<CustomerSegmentData[]>([])
  const [aiCommentary, setAiCommentary] = useState<AICommentaryData | null>(null)
  
  // New combined chart data state
  const [dashboardChartData, setDashboardChartData] = useState<DashboardChartData[]>([])
  const [orderTimingData, setOrderTimingData] = useState<OrderTimingData[]>([])
  
  // Detailed KPI data state
  const [dailyRevenueData, setDailyRevenueData] = useState<DailyRevenueData[]>([])
  const [ordersByProductData, setOrdersByProductData] = useState<OrdersByProductData[]>([])
  const [newCustomersData, setNewCustomersData] = useState<NewCustomerData[]>([])
  const [aovStatsData, setAovStatsData] = useState<AOVStatsData[]>([])
  
  // Top customers state
  const [topCustomersData, setTopCustomersData] = useState<TopCustomer[]>([])
  const [currency, setCurrency] = useState('GBP')
  
  // Custom date range state
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  
  // Granularity state for charts
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('daily')

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading dashboard data for timeframe:', timeframe)

      const dateRange = getDateRangeFromTimeframe(timeframe, customStartDate, customEndDate)
      const filters: FilterState = {
        startDate: formatDateForSQL(dateRange.startDate),
        endDate: formatDateForSQL(dateRange.endDate)
      }

      // Load all data in parallel
      const [
        currentKpis, 
        previousYearKpis, 
        revenue, 
        products, 
        dashboardData,
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
        getRevenueByDate(filters, MERCHANT_ID),
        getProductData(filters, MERCHANT_ID),
        getAllDashboardData(MERCHANT_ID, filters),
        getDashboardChartsData(MERCHANT_ID, filters).catch(err => {
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
      setRevenueData(revenue)
      setProductData(products)
      setDashboardKpis(dashboardData.kpis)
      setDashboardTrendData(dashboardData.trendData)
      setSegmentData(dashboardData.segmentData)
      setAiCommentary(dashboardData.aiCommentary)
      setDashboardChartData(chartsData.dailyData)
      setOrderTimingData(chartsData.orderTimingData)
      setDailyRevenueData(dailyRevenue)
      setOrdersByProductData(ordersByProduct)
      setNewCustomersData(newCustomers)
      setAovStatsData(aovStats)
      setTopCustomersData(topCustomers)
      setCurrency(settings.currency || 'GBP')
      setLastUpdated(new Date())
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [timeframe, customStartDate, customEndDate, granularity])

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-[240px]">
          <Header />
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-black mx-auto mb-4" />
              <p className="text-gray-600 font-light">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-[240px] overflow-auto">
        <Header />
        
        <div className="p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light text-black mb-2">Dashboard</h1>
                <p className="text-gray-600 font-light">Business performance overview</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <DateRangeSelector
                  value={timeframe}
                  onChange={setTimeframe}
                  showCustomInputs={true}
                  customStartDate={customStartDate}
                  customEndDate={customEndDate}
                  onCustomStartDateChange={setCustomStartDate}
                  onCustomEndDateChange={setCustomEndDate}
                />
                
                <Select value={granularity} onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly') => setGranularity(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  onClick={loadData} 
                  variant="outline" 
                  size="sm"
                  disabled={loading}
                  className="font-light"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <DetailedKPICard
              title="Total Revenue"
              value={kpiData?.totalRevenue || 0}
              previousValue={previousYearKpiData?.totalRevenue}
              icon={<DollarSign className="w-5 h-5" />}
              isMonetary={true}
              kpiType="revenue"
              detailedData={dailyRevenueData}
              filename="total-revenue"
            />
            <DetailedKPICard
              title="Total Orders"
              value={kpiData?.totalOrders || 0}
              previousValue={previousYearKpiData?.totalOrders}
              icon={<ShoppingCart className="w-5 h-5" />}
              isMonetary={false}
              kpiType="orders"
              detailedData={ordersByProductData}
              filename="total-orders"
            />
            <DetailedKPICard
              title="New Customers"
              value={kpiData?.newCustomers || 0}
              previousValue={previousYearKpiData?.newCustomers}
              icon={<Users className="w-5 h-5" />}
              isMonetary={false}
              kpiType="customers"
              detailedData={newCustomersData}
              filename="new-customers"
            />
            <DetailedKPICard
              title="Average Order Value"
              value={kpiData?.avgOrderValue || 0}
              previousValue={previousYearKpiData?.avgOrderValue}
              icon={<DollarSign className="w-5 h-5" />}
              isMonetary={true}
              kpiType="aov"
              detailedData={aovStatsData}
              filename="average-order-value"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Combined Revenue & Orders Chart */}
            <Card className="card-minimal">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-black">Revenue & Orders Trend</CardTitle>
                <CardDescription className="font-light text-gray-600">
                  Daily performance overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardChartData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dashboardChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          fontSize={12}
                          stroke="#666"
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis yAxisId="revenue" orientation="left" fontSize={12} stroke="#3b82f6" />
                        <YAxis yAxisId="orders" orientation="right" fontSize={12} stroke="#10b981" />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
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
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-light text-gray-500">No data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Timing Analysis */}
            <Card className="card-minimal">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-black">Order Timing Analysis</CardTitle>
                <CardDescription className="font-light text-gray-600">
                  When your site is busiest (orders by hour)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orderTimingData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={orderTimingData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="hour" 
                          fontSize={12}
                          stroke="#666"
                          tickFormatter={(value) => getHourLabel(value)}
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
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-light text-gray-500">No timing data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Timing Insights */}
          {orderTimingData.length > 0 && (
            <Card className="card-minimal mb-8">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-black">Peak Hours Insights</CardTitle>
                <CardDescription className="font-light text-gray-600">
                  Understanding your busiest and quietest periods
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}

          {/* Top Products and Top Customers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Top Products */}
            <Card className="card-minimal">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-black">Top Products</CardTitle>
                <CardDescription className="font-light text-gray-600">
                  Best performing products by revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                {productData.length > 0 ? (
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
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-light text-gray-500">No product data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

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
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  )
}