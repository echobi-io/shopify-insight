import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
  RefreshCw,
  Package,
  User,
  ArrowRight,
  Calendar,
  Mail,
  Hash,
  ChevronDown,
  ChevronUp
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
  TopProduct,
  TopCustomer,
  ProductDrillDown,
  CustomerDrillDown,
  getRevenueTimeSeries,
  getProductDrillDown,
  getCustomerDrillDown
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
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
  const [insights, setInsights] = useState<SalesInsight[]>([])
  
  // Drill-down states
  const [selectedProduct, setSelectedProduct] = useState<ProductDrillDown | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDrillDown | null>(null)
  const [showProductDrillDown, setShowProductDrillDown] = useState(false)
  const [showCustomerDrillDown, setShowCustomerDrillDown] = useState(false)
  
  // Filter states
  const [dateRange, setDateRange] = useState('2023')
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('daily')
  
  // Expandable list states
  const [showAllProducts, setShowAllProducts] = useState(false)
  const [showAllCustomers, setShowAllCustomers] = useState(false)

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
      setTopProducts(data.topProducts)
      setTopCustomers(data.topCustomers)
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

  // Handle product drill-down
  const handleProductClick = async (product: TopProduct) => {
    try {
      setLoading(true)
      const { startDate, endDate } = getDateRange(dateRange)
      const filters: FilterState = { startDate, endDate }
      
      const drillDownData = await getProductDrillDown(product.id, filters, HARDCODED_MERCHANT_ID)
      if (drillDownData) {
        setSelectedProduct(drillDownData)
        setShowProductDrillDown(true)
      }
    } catch (error) {
      console.error('❌ Error loading product drill-down:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle customer drill-down
  const handleCustomerClick = async (customer: TopCustomer) => {
    try {
      setLoading(true)
      const { startDate, endDate } = getDateRange(dateRange)
      const filters: FilterState = { startDate, endDate }
      
      const drillDownData = await getCustomerDrillDown(customer.id, filters, HARDCODED_MERCHANT_ID)
      if (drillDownData) {
        setSelectedCustomer(drillDownData)
        setShowCustomerDrillDown(true)
      }
    } catch (error) {
      console.error('❌ Error loading customer drill-down:', error)
    } finally {
      setLoading(false)
    }
  }

  // Format date based on granularity
  const formatDateForGranularity = (dateString: string, granularity: string) => {
    const date = new Date(dateString)
    
    switch (granularity) {
      case 'daily':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })
      case 'weekly':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        return `w/c ${weekStart.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })}`
      case 'monthly':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        })
      case 'quarterly':
        const quarter = Math.floor(date.getMonth() / 3) + 1
        return `Q${quarter} ${date.getFullYear()}`
      case 'yearly':
        return date.getFullYear().toString()
      default:
        return date.toLocaleDateString()
    }
  }

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-sm">
          <p className="font-medium text-black">{formatDateForGranularity(label, granularity)}</p>
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
                          tickFormatter={(value) => formatDateForGranularity(value, granularity)}
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
                          tickFormatter={(value) => formatDateForGranularity(value, granularity)}
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
                          tickFormatter={(value) => formatDateForGranularity(value, granularity)}
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

          {/* Top Products and Customers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Top 10 Products */}
            <Card className="card-minimal">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-black">Top 10 Products</CardTitle>
                <CardDescription className="font-light text-gray-600">Best performing products by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {topProducts.length > 0 ? (
                  <div className="space-y-3">
                    {topProducts.slice(0, showAllProducts ? 10 : 5).map((product, index) => (
                      <div 
                        key={product.id} 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => handleProductClick(product)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-black text-sm">{product.name}</p>
                            <p className="text-xs text-gray-500">
                              {product.quantity} units • {product.orders} orders
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <p className="font-medium text-black text-sm">${product.revenue.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">${product.avgOrderValue.toFixed(0)} AOV</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                    
                    {topProducts.length > 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllProducts(!showAllProducts)}
                        className="w-full mt-3 font-light text-gray-600 hover:text-black"
                      >
                        {showAllProducts ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            Show {Math.min(5, topProducts.length - 5)} More
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-light">No product data available for the selected period</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top 10 Customers */}
            <Card className="card-minimal">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-black">Top 10 Customers</CardTitle>
                <CardDescription className="font-light text-gray-600">Highest value customers by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {topCustomers.length > 0 ? (
                  <div className="space-y-3">
                    {topCustomers.slice(0, showAllCustomers ? 10 : 5).map((customer, index) => (
                      <Popover key={customer.id}>
                        <PopoverTrigger asChild>
                          <div 
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-black text-sm">{customer.name}</p>
                                <p className="text-xs text-gray-500">
                                  {customer.email} • {customer.orders} orders
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-right">
                                <p className="font-medium text-black text-sm">${customer.revenue.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">${customer.avgOrderValue.toFixed(0)} AOV</p>
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" side="right">
                          <div className="space-y-4">
                            <div className="border-b pb-3">
                              <h4 className="font-medium text-black">{customer.name}</h4>
                              <p className="text-sm text-gray-600">{customer.email}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                                <p className="font-medium text-black">${customer.revenue.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Total Orders</p>
                                <p className="font-medium text-black">{customer.orders}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Avg Order Value</p>
                                <p className="font-medium text-black">${customer.avgOrderValue.toFixed(0)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Last Order</p>
                                <p className="font-medium text-black">
                                  {new Date(customer.lastOrderDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            <Button
                              onClick={() => handleCustomerClick(customer)}
                              className="w-full font-light"
                              size="sm"
                            >
                              View Full Analysis
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ))}
                    
                    {topCustomers.length > 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllCustomers(!showAllCustomers)}
                        className="w-full mt-3 font-light text-gray-600 hover:text-black"
                      >
                        {showAllCustomers ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            Show {Math.min(5, topCustomers.length - 5)} More
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-light">No customer data available for the selected period</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Product Drill-Down Modal */}
          {showProductDrillDown && selectedProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-light text-black">{selectedProduct.product.name}</h2>
                      <p className="text-gray-600 font-light">Product Performance Analysis</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowProductDrillDown(false)}
                      className="font-light"
                    >
                      Close
                    </Button>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Product KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                      <p className="text-xl font-medium text-black">${selectedProduct.product.revenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Units Sold</p>
                      <p className="text-xl font-medium text-black">{selectedProduct.product.quantity.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Orders</p>
                      <p className="text-xl font-medium text-black">{selectedProduct.product.orders.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                      <p className="text-xl font-medium text-black">${selectedProduct.product.avgOrderValue.toFixed(0)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Product Revenue Time Series */}
                    <div>
                      <h3 className="text-lg font-medium text-black mb-4">Revenue Over Time</h3>
                      {selectedProduct.timeSeriesData.length > 0 ? (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={selectedProduct.timeSeriesData}>
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
                        <div className="h-64 flex items-center justify-center text-gray-500">
                          <p className="font-light">No time series data available</p>
                        </div>
                      )}
                    </div>

                    {/* Top Customers for this Product */}
                    <div>
                      <h3 className="text-lg font-medium text-black mb-4">Top Customers</h3>
                      {selectedProduct.topCustomers.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-auto">
                          {selectedProduct.topCustomers.map((customer, index) => (
                            <div key={customer.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">#{index + 1}</span>
                                <div>
                                  <p className="text-sm font-medium text-black">{customer.name}</p>
                                  <p className="text-xs text-gray-500">{customer.email}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-black">${customer.revenue.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">{customer.orders} orders</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                          <p className="font-light">No customer data available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customer Drill-Down Modal */}
          {showCustomerDrillDown && selectedCustomer && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-light text-black">{selectedCustomer.customer.name}</h2>
                      <p className="text-gray-600 font-light">Customer Performance Analysis</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowCustomerDrillDown(false)}
                      className="font-light"
                    >
                      Close
                    </Button>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Customer KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                      <p className="text-xl font-medium text-black">${selectedCustomer.customer.revenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                      <p className="text-xl font-medium text-black">{selectedCustomer.customer.orders.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                      <p className="text-xl font-medium text-black">${selectedCustomer.customer.avgOrderValue.toFixed(0)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Last Order</p>
                      <p className="text-xl font-medium text-black">
                        {new Date(selectedCustomer.customer.lastOrderDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Customer Revenue Time Series */}
                    <div>
                      <h3 className="text-lg font-medium text-black mb-4">Purchase History</h3>
                      {selectedCustomer.timeSeriesData.length > 0 ? (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={selectedCustomer.timeSeriesData}>
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
                                stroke="#10b981" 
                                fill="#10b981" 
                                fillOpacity={0.1}
                                name="Revenue"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                          <p className="font-light">No purchase history available</p>
                        </div>
                      )}
                    </div>

                    {/* Top Products for this Customer */}
                    <div>
                      <h3 className="text-lg font-medium text-black mb-4">Favorite Products</h3>
                      {selectedCustomer.topProducts.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-auto">
                          {selectedCustomer.topProducts.map((product, index) => (
                            <div key={product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">#{index + 1}</span>
                                <div>
                                  <p className="text-sm font-medium text-black">{product.name}</p>
                                  <p className="text-xs text-gray-500">{product.quantity} units</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-black">${product.revenue.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">{product.orders} orders</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                          <p className="font-light">No product data available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order History */}
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-black mb-4">Recent Orders</h3>
                    {selectedCustomer.orderHistory.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 font-medium text-gray-600">Order #</th>
                              <th className="text-left py-2 font-medium text-gray-600">Date</th>
                              <th className="text-left py-2 font-medium text-gray-600">Total</th>
                              <th className="text-left py-2 font-medium text-gray-600">Status</th>
                              <th className="text-left py-2 font-medium text-gray-600">Channel</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedCustomer.orderHistory.slice(0, 10).map((order) => (
                              <tr key={order.id} className="border-b border-gray-100">
                                <td className="py-2 text-black">{order.orderNumber}</td>
                                <td className="py-2 text-gray-600">
                                  {new Date(order.date).toLocaleDateString()}
                                </td>
                                <td className="py-2 text-black">${order.total.toLocaleString()}</td>
                                <td className="py-2">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td className="py-2 text-gray-600">{order.channel}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p className="font-light">No order history available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

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