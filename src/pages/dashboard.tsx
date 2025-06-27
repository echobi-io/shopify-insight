import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, RefreshCw, Brain, Target, Settings, AlertCircle } from 'lucide-react'
import { getKPIs, getPreviousKPIs, calculateKPIChanges, type KPIData, type FilterState } from '@/lib/fetchers/getKpis'
import { getRevenueByDate, type RevenueByDateData } from '@/lib/fetchers/getRevenueByDate'
import { getProductData } from '@/lib/fetchers/getProductData'
import { getAllDashboardData, type DashboardKPIs, type DashboardTrendData, type CustomerSegmentData, type AICommentaryData } from '@/lib/fetchers/getDashboardData'
import { getDateRangeFromTimeframe, formatDateForSQL } from '@/lib/utils/dateUtils'
import Sidebar from '@/components/Sidebar'
import DataDebugPanel from '@/components/DataDebugPanel'
import SimpleKPICard from '@/components/SimpleKPICard'

const MERCHANT_ID = '11111111-1111-1111-1111-111111111111' // Hardcoded merchant ID matching sample data

interface ProductData {
  product: string
  unitsSold: number
  revenue: number
  aov: number
  refunds: number
  repeatOrderRate: number
  trend: number[]
}

// Colors for segment pie chart
const SEGMENT_COLORS = {
  new: '#3b82f6',
  returning: '#10b981', 
  vip: '#8b5cf6',
  at_risk: '#ef4444'
}

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [timeframe, setTimeframe] = useState('all_2024')
  const [loading, setLoading] = useState(true)
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [kpiChanges, setKpiChanges] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<RevenueByDateData[]>([])
  const [productData, setProductData] = useState<ProductData[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  
  // New dashboard-specific state
  const [dashboardKpis, setDashboardKpis] = useState<DashboardKPIs | null>(null)
  const [dashboardTrendData, setDashboardTrendData] = useState<DashboardTrendData[]>([])
  const [segmentData, setSegmentData] = useState<CustomerSegmentData[]>([])
  const [aiCommentary, setAiCommentary] = useState<AICommentaryData | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(true)

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

      console.log('📅 Date filters:', filters)

      // Load all data in parallel
      const [currentKpis, previousKpis, revenue, products] = await Promise.all([
        getKPIs(filters, MERCHANT_ID),
        getPreviousKPIs(filters, MERCHANT_ID),
        getRevenueByDate(filters, MERCHANT_ID),
        getProductData(filters, MERCHANT_ID)
      ])

      console.log('📊 Data loaded:', {
        kpis: currentKpis,
        revenue: revenue.length,
        products: products.length
      })

      setKpiData(currentKpis)
      setKpiChanges(calculateKPIChanges(currentKpis, previousKpis))
      setRevenueData(revenue)
      setProductData(products)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    try {
      setDashboardLoading(true)
      console.log('🔄 Loading live dashboard data for merchant:', MERCHANT_ID, 'with timeframe:', timeframe)

      const dateRange = getDateRangeFromTimeframe(timeframe)
      const filters = {
        startDate: formatDateForSQL(dateRange.startDate),
        endDate: formatDateForSQL(dateRange.endDate)
      }

      const dashboardData = await getAllDashboardData(MERCHANT_ID, filters)
      
      console.log('📊 Dashboard data loaded:', dashboardData)

      setDashboardKpis(dashboardData.kpis)
      setDashboardTrendData(dashboardData.trendData)
      setSegmentData(dashboardData.segmentData)
      setAiCommentary(dashboardData.aiCommentary)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error)
    } finally {
      setDashboardLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [timeframe])

  useEffect(() => {
    // Load dashboard-specific data when dashboard section is active or timeframe changes
    if (activeSection === 'dashboard') {
      loadDashboardData()
    }
  }, [activeSection, timeframe])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  // Helper function to get timeframe label
  const getTimeframeLabel = () => {
    const option = timeframeOptions.find(opt => opt.value === timeframe)
    return option ? option.label : 'Selected Period'
  }

  // Section Components
  const DashboardSection = () => {
    if (dashboardLoading) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mr-3" />
            <span className="text-slate-600">Loading dashboard data...</span>
          </div>
        </motion.div>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Current Data KPIs - Compact */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Today's Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SimpleKPICard
              title="Revenue Today"
              value={dashboardKpis ? formatCurrency(dashboardKpis.revenueToday) : '$0'}
              icon={<DollarSign />}
              change={kpiChanges?.totalRevenue ? `${Math.abs(kpiChanges.totalRevenue.percentageChange).toFixed(1)}%` : undefined}
              changeType={kpiChanges?.totalRevenue ? (kpiChanges.totalRevenue.percentageChange >= 0 ? 'positive' : 'negative') : undefined}
              trend={dashboardTrendData.slice(-7).map(d => d.total_revenue)}
            />
            <SimpleKPICard
              title="Orders Today"
              value={dashboardKpis ? formatNumber(dashboardKpis.ordersToday) : '0'}
              icon={<ShoppingCart />}
              change={kpiChanges?.totalOrders ? `${Math.abs(kpiChanges.totalOrders.percentageChange).toFixed(1)}%` : undefined}
              changeType={kpiChanges?.totalOrders ? (kpiChanges.totalOrders.percentageChange >= 0 ? 'positive' : 'negative') : undefined}
              trend={dashboardTrendData.slice(-7).map(d => d.total_orders)}
            />
            <SimpleKPICard
              title="New Customers"
              value={dashboardKpis ? formatNumber(dashboardKpis.newCustomers) : '0'}
              icon={<Users />}
              change={kpiChanges?.newCustomers ? `${Math.abs(kpiChanges.newCustomers.percentageChange).toFixed(1)}%` : undefined}
              changeType={kpiChanges?.newCustomers ? (kpiChanges.newCustomers.percentageChange >= 0 ? 'positive' : 'negative') : undefined}
            />
            <SimpleKPICard
              title="AOV (7d)"
              value={dashboardKpis ? formatCurrency(dashboardKpis.avgOrderValue7d) : '$0'}
              icon={<DollarSign />}
              change={kpiChanges?.avgOrderValue ? `${Math.abs(kpiChanges.avgOrderValue.percentageChange).toFixed(1)}%` : undefined}
              changeType={kpiChanges?.avgOrderValue ? (kpiChanges.avgOrderValue.percentageChange >= 0 ? 'positive' : 'negative') : undefined}
            />
          </div>
        </div>

        {/* Filtered Period KPIs - Compact */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            {getTimeframeLabel()} Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SimpleKPICard
              title="Total Revenue"
              value={kpiData ? formatCurrency(kpiData.totalRevenue) : '$0'}
              icon={<DollarSign />}
              change={kpiChanges?.totalRevenue ? `${Math.abs(kpiChanges.totalRevenue.percentageChange).toFixed(1)}%` : undefined}
              changeType={kpiChanges?.totalRevenue ? (kpiChanges.totalRevenue.percentageChange >= 0 ? 'positive' : 'negative') : undefined}
              trend={dashboardTrendData.map(d => d.total_revenue)}
            />
            <SimpleKPICard
              title="Total Orders"
              value={kpiData ? formatNumber(kpiData.totalOrders) : '0'}
              icon={<ShoppingCart />}
              change={kpiChanges?.totalOrders ? `${Math.abs(kpiChanges.totalOrders.percentageChange).toFixed(1)}%` : undefined}
              changeType={kpiChanges?.totalOrders ? (kpiChanges.totalOrders.percentageChange >= 0 ? 'positive' : 'negative') : undefined}
              trend={dashboardTrendData.map(d => d.total_orders)}
            />
            <SimpleKPICard
              title="New Customers"
              value={kpiData ? formatNumber(kpiData.newCustomers) : '0'}
              icon={<Users />}
              change={kpiChanges?.newCustomers ? `${Math.abs(kpiChanges.newCustomers.percentageChange).toFixed(1)}%` : undefined}
              changeType={kpiChanges?.newCustomers ? (kpiChanges.newCustomers.percentageChange >= 0 ? 'positive' : 'negative') : undefined}
            />
            <SimpleKPICard
              title="Avg Order Value"
              value={kpiData ? formatCurrency(kpiData.avgOrderValue) : '$0'}
              icon={<DollarSign />}
              change={kpiChanges?.avgOrderValue ? `${Math.abs(kpiChanges.avgOrderValue.percentageChange).toFixed(1)}%` : undefined}
              changeType={kpiChanges?.avgOrderValue ? (kpiChanges.avgOrderValue.percentageChange >= 0 ? 'positive' : 'negative') : undefined}
            />
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Revenue & Orders Trend - Compact */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Revenue & Orders Trend</CardTitle>
              <CardDescription className="text-sm">Performance over selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardTrendData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardTrendData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        fontSize={11}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis yAxisId="left" fontSize={11} />
                      <YAxis yAxisId="right" orientation="right" fontSize={11} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: any, name: string) => [
                          name === 'total_revenue' ? formatCurrency(value) : formatNumber(value),
                          name === 'total_revenue' ? 'Revenue' : 'Orders'
                        ]}
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="total_revenue" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="total_orders" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No trend data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Segments - Compact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Customer Segments</CardTitle>
              <CardDescription className="text-sm">Order distribution by type</CardDescription>
            </CardHeader>
            <CardContent>
              {segmentData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={segmentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ customer_segment, percentage }) => `${customer_segment}: ${percentage}%`}
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="orders_count"
                      >
                        {segmentData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={SEGMENT_COLORS[entry.customer_segment as keyof typeof SEGMENT_COLORS] || '#8884d8'} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any, name: string) => [formatNumber(value), 'Orders']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No segment data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Top Products Mini Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Top Products</CardTitle>
              <CardDescription className="text-sm">Best performers this period</CardDescription>
            </CardHeader>
            <CardContent>
              {productData.length > 0 ? (
                <div className="space-y-2">
                  {productData.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                            {product.product}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatNumber(product.unitsSold)} units
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(product.revenue)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(product.aov)} AOV
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Package className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No product data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Revenue Distribution</CardTitle>
              <CardDescription className="text-sm">Daily revenue breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardTrendData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardTrendData.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        fontSize={10}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                      />
                      <YAxis fontSize={10} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                      />
                      <Bar dataKey="total_revenue" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No revenue data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Conversion Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Conversion Metrics</CardTitle>
              <CardDescription className="text-sm">Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Order-to-Customer Ratio</span>
                  <span className="text-sm font-semibold">
                    {kpiData && kpiData.newCustomers > 0 ? 
                      `${(kpiData.totalOrders / kpiData.newCustomers).toFixed(1)}:1` : 
                      'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Return Customer Rate</span>
                  <span className="text-sm font-semibold">
                    {segmentData.length > 0 ? 
                      `${(segmentData.find(s => s.customer_segment === 'returning')?.percentage || 0).toFixed(1)}%` : 
                      'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Customer Lifetime Value</span>
                  <span className="text-sm font-semibold">
                    {kpiData ? formatCurrency(kpiData.avgOrderValue * 2.5) : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Growth Indicators */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Growth Indicators</CardTitle>
              <CardDescription className="text-sm">Period-over-period changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Revenue Growth</span>
                  <div className="flex items-center space-x-1">
                    {kpiChanges?.totalRevenue ? (
                      <>
                        {kpiChanges.totalRevenue.percentageChange >= 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        )}
                        <span className={`text-sm font-semibold ${
                          kpiChanges.totalRevenue.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Math.abs(kpiChanges.totalRevenue.percentageChange).toFixed(1)}%
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-semibold text-gray-400">N/A</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Order Growth</span>
                  <div className="flex items-center space-x-1">
                    {kpiChanges?.totalOrders ? (
                      <>
                        {kpiChanges.totalOrders.percentageChange >= 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        )}
                        <span className={`text-sm font-semibold ${
                          kpiChanges.totalOrders.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Math.abs(kpiChanges.totalOrders.percentageChange).toFixed(1)}%
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-semibold text-gray-400">N/A</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Customer Growth</span>
                  <div className="flex items-center space-x-1">
                    {kpiChanges?.newCustomers ? (
                      <>
                        {kpiChanges.newCustomers.percentageChange >= 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        )}
                        <span className={`text-sm font-semibold ${
                          kpiChanges.newCustomers.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Math.abs(kpiChanges.newCustomers.percentageChange).toFixed(1)}%
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-semibold text-gray-400">N/A</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription className="text-sm">Common tasks and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Package className="w-4 h-4 mr-2" />
                  View Product Performance
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Analyze Customer Segments
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Export Sales Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights - Compact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Brain className="h-4 w-4 mr-2 text-purple-600" />
              AI Business Insights
            </CardTitle>
            <CardDescription className="text-sm">Live analysis of your business performance</CardDescription>
          </CardHeader>
          <CardContent>
            {aiCommentary ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {aiCommentary.commentary}
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500 text-xs">Revenue Change:</span>
                    <div className={`font-semibold ${aiCommentary.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {aiCommentary.revenueChange >= 0 ? '+' : ''}{aiCommentary.revenueChange.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">Top Product:</span>
                    <div className="font-semibold text-slate-900 truncate">
                      {aiCommentary.topProduct}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">At Risk Customers:</span>
                    <div className="font-semibold text-orange-600">
                      {formatNumber(aiCommentary.customerChurnIndicator)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">Product Growth:</span>
                    <div className="font-semibold text-blue-600">
                      {aiCommentary.topProductGrowth.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-6">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No insights available yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const SalesAnalysisSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue</CardTitle>
            <CardDescription>Revenue breakdown by day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Orders</CardTitle>
            <CardDescription>Order volume by day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: any) => [formatNumber(value), 'Orders']}
                  />
                  <Bar dataKey="orders" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Summary</CardTitle>
          <CardDescription>Key metrics for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {kpiData ? formatCurrency(kpiData.totalRevenue) : '$0'}
              </div>
              <div className="text-sm text-slate-600">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {kpiData ? formatNumber(kpiData.totalOrders) : '0'}
              </div>
              <div className="text-sm text-slate-600">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {kpiData ? formatCurrency(kpiData.avgOrderValue) : '$0'}
              </div>
              <div className="text-sm text-slate-600">Avg Order Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {kpiData ? formatNumber(kpiData.newCustomers) : '0'}
              </div>
              <div className="text-sm text-slate-600">New Customers</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  const ProductInsightSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
          <CardDescription>Best performing products by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">AOV</TableHead>
                <TableHead className="text-right">Repeat Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productData.length > 0 ? (
                productData.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{product.product}</TableCell>
                    <TableCell className="text-right">{formatNumber(product.unitsSold)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.aov)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={product.repeatOrderRate > 20 ? "default" : "secondary"}>
                        {formatPercentage(product.repeatOrderRate)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500">
                    No product data available for the selected period
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Product Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productData.length}</div>
            <p className="text-xs text-muted-foreground">
              Products with sales in this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(productData.reduce((sum, p) => sum + p.unitsSold, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Repeat Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productData.length > 0 ? 
                formatPercentage(productData.reduce((sum, p) => sum + p.repeatOrderRate, 0) / productData.length) : 
                '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Average across all products
            </p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )

  const PlaceholderSection = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            {icon}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-500 text-center max-w-md">
            This section is coming soon. We're working on bringing you comprehensive {title.toLowerCase()} analytics.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection />
      case 'sales-analysis':
        return <SalesAnalysisSection />
      case 'product-insight':
        return <ProductInsightSection />
      case 'customer-insight':
        return <PlaceholderSection title="Customer Insight" icon={<Users className="h-8 w-8 text-purple-600" />} />
      case 'churn-ltv':
        return <PlaceholderSection title="Churn & LTV" icon={<Target className="h-8 w-8 text-purple-600" />} />
      case 'ai-predict':
        return <PlaceholderSection title="AI Predict" icon={<Brain className="h-8 w-8 text-purple-600" />} />
      case 'segments-filters':
        return <PlaceholderSection title="Segments & Filters" icon={<Package className="h-8 w-8 text-purple-600" />} />
      case 'settings':
        return <PlaceholderSection title="Settings" icon={<Settings className="h-8 w-8 text-purple-600" />} />
      case 'debug':
        return <DataDebugPanel />
      default:
        return <DashboardSection />
    }
  }

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'dashboard':
        return 'Dashboard Overview'
      case 'sales-analysis':
        return 'Sales Analysis'
      case 'product-insight':
        return 'Product Insight'
      case 'customer-insight':
        return 'Customer Insight'
      case 'churn-ltv':
        return 'Churn & LTV Analysis'
      case 'ai-predict':
        return 'AI Predictions'
      case 'segments-filters':
        return 'Segments & Filters'
      case 'settings':
        return 'Settings'
      case 'debug':
        return 'Debug Panel'
      default:
        return 'Dashboard Overview'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content */}
      <div className="flex-1 ml-[220px]">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{getSectionTitle()}</h1>
                <p className="text-sm text-slate-600">
                  Last updated: {lastUpdated.toLocaleString()}
                </p>
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
                  onClick={() => {
                    if (activeSection === 'dashboard') {
                      loadDashboardData()
                    } else {
                      loadData()
                    }
                  }} 
                  variant="outline" 
                  size="sm"
                  disabled={activeSection === 'dashboard' ? dashboardLoading : loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${(activeSection === 'dashboard' ? dashboardLoading : loading) ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-6">
          <AnimatePresence mode="wait">
            {renderActiveSection()}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}