import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  ComposedChart,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Target,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { FilterState } from '@/lib/fetchers/getKpis'
import { 
  getSalesAnalysisData,
  SalesAnalysisKPIs,
  RevenueTimeSeriesData,
  ChannelRevenueData,
  SalesInsight,
  getRevenueTimeSeries
} from '@/lib/fetchers/getSalesAnalysisData'

const HARDCODED_MERCHANT_ID = '11111111-1111-1111-1111-111111111111'

// Date range presets
const DATE_RANGES = [
  { label: 'All Time', value: 'all' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 3 Months', value: '3m' },
  { label: 'Last 12 Months', value: '12m' },
  { label: 'Year to Date', value: 'ytd' },
  { label: '2023 Data', value: '2023' },
  { label: 'Custom', value: 'custom' }
]

// Helper function to get date range
function getDateRange(range: string): { startDate: string; endDate: string } {
  const now = new Date()
  const endDate = now.toISOString()
  let startDate: string

  switch (range) {
    case 'all':
      startDate = new Date('2020-01-01').toISOString()
      break
    case '2023':
      startDate = new Date('2023-01-01').toISOString()
      return { startDate, endDate: new Date('2023-12-31T23:59:59.999Z').toISOString() }
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      break
    case '3m':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
      break
    case '12m':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
      break
    case 'ytd':
      startDate = new Date(now.getFullYear(), 0, 1).toISOString()
      break
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }

  return { startDate, endDate }
}

// KPI Card Component
interface KPICardProps {
  title: string
  value: number | null
  growth: number | null
  icon: React.ReactNode
  format?: 'currency' | 'number' | 'percentage'
  suffix?: string
}

const KPICard: React.FC<KPICardProps> = ({ title, value, growth, icon, format = 'number', suffix = '' }) => {
  const formatValue = (val: number | null) => {
    if (val === null) return 'No data'
    
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString()}`
      case 'percentage':
        return `${val.toFixed(1)}%`
      default:
        return val.toLocaleString() + suffix
    }
  }

  const getGrowthColor = (growth: number | null) => {
    if (growth === null) return 'text-gray-400'
    return growth >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const getGrowthIcon = (growth: number | null) => {
    if (growth === null) return null
    return growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
  }

  return (
    <Card className="card-minimal">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-light text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-light text-black">{formatValue(value)}</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-gray-400 mb-2">
              {icon}
            </div>
            {growth !== null && (
              <div className={`flex items-center text-sm font-light ${getGrowthColor(growth)}`}>
                {getGrowthIcon(growth)}
                <span className="ml-1">{Math.abs(growth).toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const SalesAnalysisPage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Data states
  const [kpis, setKpis] = useState<SalesAnalysisKPIs | null>(null)
  const [timeSeriesData, setTimeSeriesData] = useState<RevenueTimeSeriesData[]>([])
  const [channelData, setChannelData] = useState<ChannelRevenueData[]>([])
  const [insights, setInsights] = useState<SalesInsight[]>([])
  
  // Filter states
  const [dateRange, setDateRange] = useState('2023')
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('daily')

  // Load data
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const { startDate, endDate } = getDateRange(dateRange)
      const filters: FilterState = {
        startDate,
        endDate
      }

      console.log('🔄 Loading sales analysis data with filters:', filters)

      const data = await getSalesAnalysisData(filters, HARDCODED_MERCHANT_ID)
      
      setKpis(data.kpis)
      setTimeSeriesData(data.timeSeriesData)
      setChannelData(data.channelData)
      setInsights(data.insights)

      // Load time series data with selected granularity
      const timeSeriesWithGranularity = await getRevenueTimeSeries(filters, granularity, HARDCODED_MERCHANT_ID)
      setTimeSeriesData(timeSeriesWithGranularity)

    } catch (err) {
      console.error('❌ Error loading sales analysis data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load sales analysis data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [dateRange, granularity])

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-sm">
          <p className="font-medium text-black">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-light" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Revenue') ? `$${entry.value.toLocaleString()}` : entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
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
              <p className="text-gray-600 font-light">Loading sales analysis...</p>
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
                <h1 className="text-3xl font-light text-black mb-2">Sales Analysis</h1>
                <p className="text-gray-600 font-light">Revenue trends and performance insights</p>
              </div>
              
              {/* Filters */}
              <div className="flex items-center space-x-4">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_RANGES.map(range => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
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

          {/* Error Alert */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 font-light">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard
              title="Total Revenue"
              value={kpis?.totalRevenue || null}
              growth={kpis?.revenueGrowth || null}
              icon={<DollarSign className="w-5 h-5" />}
              format="currency"
            />
            <KPICard
              title="Total Orders"
              value={kpis?.totalOrders || null}
              growth={kpis?.ordersGrowth || null}
              icon={<ShoppingCart className="w-5 h-5" />}
            />
            <KPICard
              title="Average Order Value"
              value={kpis?.avgOrderValue || null}
              growth={kpis?.aovGrowth || null}
              icon={<Target className="w-5 h-5" />}
              format="currency"
            />
            <KPICard
              title="New Customers"
              value={kpis?.newCustomers || null}
              growth={kpis?.customerGrowth || null}
              icon={<Users className="w-5 h-5" />}
            />
          </div>

          {/* Main Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Revenue Over Time */}
            <Card className="card-minimal">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-black">Revenue Over Time</CardTitle>
                <CardDescription className="font-light text-gray-600">
                  {granularity.charAt(0).toUpperCase() + granularity.slice(1)} revenue trend
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timeSeriesData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          fontSize={12}
                          stroke="#666"
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis fontSize={12} stroke="#666" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#3b82f6" 
                          fill="#3b82f6" 
                          fillOpacity={0.1}
                          name="Revenue"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-light">No revenue data available for the selected period</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Volume vs Revenue */}
            <Card className="card-minimal">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-black">Order Volume vs Revenue</CardTitle>
                <CardDescription className="font-light text-gray-600">Dual-axis view of orders and revenue correlation</CardDescription>
              </CardHeader>
              <CardContent>
                {timeSeriesData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          fontSize={12}
                          stroke="#666"
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis yAxisId="left" fontSize={12} stroke="#666" tickFormatter={(value) => value.toLocaleString()} />
                        <YAxis yAxisId="right" orientation="right" fontSize={12} stroke="#666" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar yAxisId="left" dataKey="orders" fill="#10b981" name="Orders" />
                        <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-light">No order data available for the selected period</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Secondary Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Average Order Value Trend */}
            <Card className="card-minimal">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-black">Average Order Value Trend</CardTitle>
                <CardDescription className="font-light text-gray-600">Track pricing and bundling effectiveness</CardDescription>
              </CardHeader>
              <CardContent>
                {timeSeriesData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          fontSize={12}
                          stroke="#666"
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis fontSize={12} stroke="#666" tickFormatter={(value) => `$${value.toFixed(0)}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line 
                          type="monotone" 
                          dataKey="avgOrderValue" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          name="AOV"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-light">No AOV data available for the selected period</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue by Channel */}
            <Card className="card-minimal">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-black">Revenue by Channel</CardTitle>
                <CardDescription className="font-light text-gray-600">Channel performance breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {channelData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={channelData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ channel, percentage }) => `${channel}: ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="revenue"
                        >
                          {channelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-light">No channel data available for the selected period</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* No Data State */}
          {!loading && (!kpis || (kpis.totalRevenue === null && kpis.totalOrders === null)) && (
            <Card className="card-minimal">
              <CardContent className="p-12 text-center">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-medium text-black mb-2">No Sales Data Available</h3>
                <p className="text-gray-600 font-light mb-4">
                  We couldn't find any sales data for the selected time period and filters.
                </p>
                <p className="text-sm font-light text-gray-500">
                  Try adjusting your date range or removing filters to see more data.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SalesAnalysis() {
  return (
    <ProtectedRoute>
      <SalesAnalysisPage />
    </ProtectedRoute>
  )
}