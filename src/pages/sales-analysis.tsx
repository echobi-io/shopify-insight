import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Cell,
  Legend
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Target,
  Calendar,
  Filter,
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { SalesAnalysisDebug } from '@/components/SalesAnalysisDebug'
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
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 3 Months', value: '3m' },
  { label: 'Last 12 Months', value: '12m' },
  { label: 'Year to Date', value: 'ytd' },
  { label: 'Custom', value: 'custom' }
]

// Helper function to get date range
function getDateRange(range: string): { startDate: string; endDate: string } {
  const now = new Date()
  const endDate = now.toISOString()
  let startDate: string

  switch (range) {
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
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
            </div>
          </div>
          {growth !== null && (
            <div className={`flex items-center space-x-1 ${getGrowthColor(growth)}`}>
              {getGrowthIcon(growth)}
              <span className="text-sm font-medium">{Math.abs(growth).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Insight Card Component
interface InsightCardProps {
  insight: SalesInsight
}

const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'growth':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'decline':
        return <TrendingDown className="w-5 h-5 text-red-600" />
      case 'anomaly':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'channel':
        return <Target className="w-5 h-5 text-blue-600" />
      default:
        return <Info className="w-5 h-5 text-gray-600" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {getInsightIcon(insight.type)}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">{insight.title}</h4>
              <Badge className={getImpactColor(insight.impact)}>
                {insight.impact}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{insight.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const SalesAnalysisPage: React.FC = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('sales-analysis')
  
  // Data states
  const [kpis, setKpis] = useState<SalesAnalysisKPIs | null>(null)
  const [timeSeriesData, setTimeSeriesData] = useState<RevenueTimeSeriesData[]>([])
  const [channelData, setChannelData] = useState<ChannelRevenueData[]>([])
  const [insights, setInsights] = useState<SalesInsight[]>([])
  
  // Filter states
  const [dateRange, setDateRange] = useState('30d')
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [channel, setChannel] = useState('all')
  const [segment, setSegment] = useState('all')

  // Load data
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const { startDate, endDate } = getDateRange(dateRange)
      const filters: FilterState = {
        startDate,
        endDate,
        channel: channel === 'all' ? undefined : channel,
        segment: segment === 'all' ? undefined : segment
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
  }, [dateRange, granularity, channel, segment])

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
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
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="flex-1 ml-[220px]">
          <Header />
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading sales analysis...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <div className="flex-1 ml-[220px] overflow-auto">
        <Header />
        
        <div className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Sales Analysis</h1>
                <p className="text-gray-600 mt-1">AI-powered insights into your sales performance and revenue trends</p>
              </div>
              
              {/* Filters */}
              <div className="flex items-center space-x-4">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-40">
                    <Calendar className="w-4 h-4 mr-2" />
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
                
                <Select value={granularity} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setGranularity(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Debug Component - Temporary */}
          <SalesAnalysisDebug />

          {/* Error Alert */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <KPICard
              title="Total Revenue"
              value={kpis?.totalRevenue || null}
              growth={kpis?.revenueGrowth || null}
              icon={<DollarSign className="w-5 h-5 text-purple-600" />}
              format="currency"
            />
            <KPICard
              title="Total Orders"
              value={kpis?.totalOrders || null}
              growth={kpis?.ordersGrowth || null}
              icon={<ShoppingCart className="w-5 h-5 text-purple-600" />}
            />
            <KPICard
              title="Average Order Value"
              value={kpis?.avgOrderValue || null}
              growth={kpis?.aovGrowth || null}
              icon={<Target className="w-5 h-5 text-purple-600" />}
              format="currency"
            />
            <KPICard
              title="Top Channel"
              value={null}
              growth={null}
              icon={<Users className="w-5 h-5 text-purple-600" />}
            />
            <KPICard
              title="Growth Driver"
              value={null}
              growth={null}
              icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
            />
          </div>

          {/* Top Channel and Growth Driver Info */}
          {(kpis?.topChannel || kpis?.growthDriver) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {kpis.topChannel && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Top Performing Channel</p>
                        <p className="text-lg font-semibold text-gray-900">{kpis.topChannel}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {kpis.growthDriver && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Primary Growth Driver</p>
                        <p className="text-lg font-semibold text-gray-900 capitalize">
                          {kpis.growthDriver === 'aov' ? 'Average Order Value' : 
                           kpis.growthDriver === 'volume' ? 'Order Volume' : 'Mixed Factors'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Main Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
                <CardDescription>
                  {granularity.charAt(0).toUpperCase() + granularity.slice(1)} revenue trend
                  {kpis?.revenueGrowth && (
                    <Badge className={`ml-2 ${kpis.revenueGrowth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {kpis.revenueGrowth >= 0 ? '+' : ''}{kpis.revenueGrowth.toFixed(1)}% vs previous period
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timeSeriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#8b5cf6" 
                        fill="#8b5cf6" 
                        fillOpacity={0.3}
                        name="Revenue"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No revenue data available for the selected period</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Volume vs Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Order Volume vs Revenue</CardTitle>
                <CardDescription>Dual-axis view of orders and revenue correlation</CardDescription>
              </CardHeader>
              <CardContent>
                {timeSeriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis yAxisId="left" tickFormatter={(value) => value.toLocaleString()} />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar yAxisId="left" dataKey="orders" fill="#3b82f6" name="Orders" />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} name="Revenue" />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    <div className="text-center">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No order data available for the selected period</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Secondary Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Average Order Value Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Average Order Value Trend</CardTitle>
                <CardDescription>Track pricing and bundling effectiveness</CardDescription>
              </CardHeader>
              <CardContent>
                {timeSeriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
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
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    <div className="text-center">
                      <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No AOV data available for the selected period</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue by Channel */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Channel</CardTitle>
                <CardDescription>Channel performance breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {channelData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
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
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    <div className="text-center">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No channel data available for the selected period</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          {insights.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                  <span>AI-Powered Insights</span>
                </CardTitle>
                <CardDescription>
                  Intelligent analysis of your sales performance and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.map((insight, index) => (
                    <InsightCard key={index} insight={insight} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Data State */}
          {!loading && (!kpis || (kpis.totalRevenue === null && kpis.totalOrders === null)) && (
            <Card>
              <CardContent className="p-12 text-center">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sales Data Available</h3>
                <p className="text-gray-600 mb-4">
                  We couldn't find any sales data for the selected time period and filters.
                </p>
                <p className="text-sm text-gray-500">
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