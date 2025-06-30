import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, RefreshCw, AlertCircle } from 'lucide-react'
import { getKPIs, getPreviousYearKPIs, calculateKPIChanges, type KPIData, type FilterState } from '@/lib/fetchers/getKpis'
import { getRevenueByDate, type RevenueByDateData } from '@/lib/fetchers/getRevenueByDate'
import { getProductData } from '@/lib/fetchers/getProductData'
import { getAllDashboardData, type DashboardKPIs, type DashboardTrendData, type CustomerSegmentData, type AICommentaryData } from '@/lib/fetchers/getDashboardData'
import { getDateRangeFromTimeframe, formatDateForSQL } from '@/lib/utils/dateUtils'
import { formatCurrency } from '@/lib/utils/settingsUtils'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import ProtectedRoute from '@/components/ProtectedRoute'
import EnhancedKPICard from '@/components/EnhancedKPICard'

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
  const [timeframe, setTimeframe] = useState('all_2024')
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

  const timeframeOptions = [
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'last_90_days', label: 'Last 90 Days' },
    { value: 'last_6_months', label: 'Last 6 Months' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'this_month', label: 'This Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'all_2024', label: 'All of 2024' },
    { value: 'all_2023', label: 'All of 2023' }
  ]

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading dashboard data for timeframe:', timeframe)

      const dateRange = getDateRangeFromTimeframe(timeframe)
      const filters: FilterState = {
        startDate: formatDateForSQL(dateRange.startDate),
        endDate: formatDateForSQL(dateRange.endDate)
      }

      // Load all data in parallel
      const [currentKpis, previousYearKpis, revenue, products, dashboardData] = await Promise.all([
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
        getAllDashboardData(MERCHANT_ID, filters)
      ])

      setKpiData(currentKpis)
      setPreviousYearKpiData(previousYearKpis)
      setRevenueData(revenue)
      setProductData(products)
      setDashboardKpis(dashboardData.kpis)
      setDashboardTrendData(dashboardData.trendData)
      setSegmentData(dashboardData.segmentData)
      setAiCommentary(dashboardData.aiCommentary)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [timeframe])

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
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeframeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
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
            <EnhancedKPICard
              title="Total Revenue"
              value={kpiData?.totalRevenue || 0}
              previousValue={previousYearKpiData?.totalRevenue}
              icon={<DollarSign className="w-5 h-5" />}
              isMonetary={true}
            />
            <EnhancedKPICard
              title="Total Orders"
              value={kpiData?.totalOrders || 0}
              previousValue={previousYearKpiData?.totalOrders}
              icon={<ShoppingCart className="w-5 h-5" />}
              isMonetary={false}
            />
            <EnhancedKPICard
              title="New Customers"
              value={kpiData?.newCustomers || 0}
              previousValue={previousYearKpiData?.newCustomers}
              icon={<Users className="w-5 h-5" />}
              isMonetary={false}
            />
            <EnhancedKPICard
              title="Average Order Value"
              value={kpiData?.avgOrderValue || 0}
              previousValue={previousYearKpiData?.avgOrderValue}
              icon={<DollarSign className="w-5 h-5" />}
              isMonetary={true}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Revenue Trend */}
            <Card className="card-minimal">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-black">Revenue Trend</CardTitle>
                <CardDescription className="font-light text-gray-600">
                  Daily revenue performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardTrendData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dashboardTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          fontSize={12}
                          stroke="#666"
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis fontSize={12} stroke="#666" />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '0',
                            fontSize: '14px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="total_revenue" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={false}
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

            {/* Order Volume */}
            <Card className="card-minimal">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-black">Order Volume</CardTitle>
                <CardDescription className="font-light text-gray-600">
                  Daily order count
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardTrendData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          fontSize={12}
                          stroke="#666"
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis fontSize={12} stroke="#666" />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          formatter={(value: any) => [formatNumber(value), 'Orders']}
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '0',
                            fontSize: '14px'
                          }}
                        />
                        <Bar dataKey="total_orders" fill="#10b981" />
                      </BarChart>
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
          </div>

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