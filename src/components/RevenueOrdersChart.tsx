import React, { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Calendar, Info, ChevronRight, Eye } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils/settingsUtils'

interface ChartDataPoint {
  date: string
  total_revenue: number
  total_orders: number
}

interface RevenueOrdersChartProps {
  data: ChartDataPoint[]
  granularity: string
  currency?: string
  loading?: boolean
  className?: string
}

const RevenueOrdersChart: React.FC<RevenueOrdersChartProps> = ({
  data,
  granularity,
  currency = 'GBP',
  loading = false,
  className = ''
}) => {
  const [selectedDataPoint, setSelectedDataPoint] = useState<ChartDataPoint | null>(null)
  const [drillDownOpen, setDrillDownOpen] = useState(false)

  // Calculate insights from the data
  const insights = useMemo(() => {
    if (!data || data.length === 0) return null

    const totalRevenue = data.reduce((sum, point) => sum + point.total_revenue, 0)
    const totalOrders = data.reduce((sum, point) => sum + point.total_orders, 0)
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Find peak performance
    const peakRevenue = data.reduce((max, point) => 
      point.total_revenue > max.total_revenue ? point : max
    )
    const peakOrders = data.reduce((max, point) => 
      point.total_orders > max.total_orders ? point : max
    )

    // Calculate trends (comparing first half vs second half)
    const midPoint = Math.floor(data.length / 2)
    const firstHalf = data.slice(0, midPoint)
    const secondHalf = data.slice(midPoint)
    
    const firstHalfAvgRevenue = firstHalf.reduce((sum, p) => sum + p.total_revenue, 0) / firstHalf.length
    const secondHalfAvgRevenue = secondHalf.reduce((sum, p) => sum + p.total_revenue, 0) / secondHalf.length
    const revenueTrend = secondHalfAvgRevenue > firstHalfAvgRevenue ? 'up' : 'down'
    const revenueTrendPercent = firstHalfAvgRevenue > 0 ? 
      ((secondHalfAvgRevenue - firstHalfAvgRevenue) / firstHalfAvgRevenue) * 100 : 0

    const firstHalfAvgOrders = firstHalf.reduce((sum, p) => sum + p.total_orders, 0) / firstHalf.length
    const secondHalfAvgOrders = secondHalf.reduce((sum, p) => sum + p.total_orders, 0) / secondHalf.length
    const ordersTrend = secondHalfAvgOrders > firstHalfAvgOrders ? 'up' : 'down'
    const ordersTrendPercent = firstHalfAvgOrders > 0 ? 
      ((secondHalfAvgOrders - firstHalfAvgOrders) / firstHalfAvgOrders) * 100 : 0

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      peakRevenue,
      peakOrders,
      revenueTrend,
      revenueTrendPercent,
      ordersTrend,
      ordersTrendPercent
    }
  }, [data])

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const formatDateLabel = (value: string) => {
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
  }

  const formatTooltipLabel = (value: string) => {
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
  }

  const handleDataPointClick = (dataPoint: any) => {
    if (dataPoint && dataPoint.activePayload && dataPoint.activePayload[0]) {
      const clickedData = dataPoint.activePayload[0].payload
      setSelectedDataPoint(clickedData)
      setDrillDownOpen(true)
    }
  }

  if (loading) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Revenue & Orders Performance
          </CardTitle>
          <CardDescription>Track your sales performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No data available</p>
              <p className="text-sm">No revenue or order data found for the selected period</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={`${className} hover:shadow-lg transition-shadow duration-200`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Revenue & Orders Performance
              </CardTitle>
              <CardDescription>
                {granularity.charAt(0).toUpperCase() + granularity.slice(1)} performance overview • Click any point for details
              </CardDescription>
            </div>
            {insights && (
              <div className="flex items-center gap-2">
                <Badge variant={insights.revenueTrend === 'up' ? 'default' : 'secondary'} className="flex items-center gap-1">
                  {insights.revenueTrend === 'up' ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(insights.revenueTrendPercent).toFixed(1)}%
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Quick Stats */}
          {insights && (
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Revenue</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(insights.totalRevenue)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Orders</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatNumber(insights.totalOrders)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Avg Order Value</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(insights.avgOrderValue)}</p>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={data}
                onClick={handleDataPointClick}
                style={{ cursor: 'pointer' }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  stroke="#666"
                  tickFormatter={formatDateLabel}
                />
                <YAxis yAxisId="revenue" orientation="left" fontSize={12} stroke="#3b82f6" />
                <YAxis yAxisId="orders" orientation="right" fontSize={12} stroke="#10b981" />
                <Tooltip 
                  labelFormatter={formatTooltipLabel}
                  formatter={(value: any, name: string) => [
                    name === 'total_revenue' ? formatCurrency(value) : formatNumber(value),
                    name === 'total_revenue' ? 'Revenue' : 'Orders'
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  yAxisId="revenue"
                  type="monotone" 
                  dataKey="total_revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: 'white' }}
                  name="Revenue"
                />
                <Line 
                  yAxisId="orders"
                  type="monotone" 
                  dataKey="total_orders" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: 'white' }}
                  name="Orders"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Highlights */}
          {insights && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Peak Revenue Day</span>
                </div>
                <p className="text-sm text-blue-800">
                  {formatTooltipLabel(insights.peakRevenue.date)} • {formatCurrency(insights.peakRevenue.total_revenue)}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingCart className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Peak Orders Day</span>
                </div>
                <p className="text-sm text-green-800">
                  {formatTooltipLabel(insights.peakOrders.date)} • {formatNumber(insights.peakOrders.total_orders)} orders
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drill-down Dialog */}
      <Dialog open={drillDownOpen} onOpenChange={setDrillDownOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Performance Details
            </DialogTitle>
            <DialogDescription>
              Detailed breakdown for {selectedDataPoint ? formatTooltipLabel(selectedDataPoint.date) : ''}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDataPoint && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Revenue</span>
                      </div>
                      <p className="text-2xl font-bold">{formatCurrency(selectedDataPoint.total_revenue)}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {insights && ((selectedDataPoint.total_revenue / insights.totalRevenue) * 100).toFixed(1)}% of total
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <ShoppingCart className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Orders</span>
                      </div>
                      <p className="text-2xl font-bold">{formatNumber(selectedDataPoint.total_orders)}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {insights && ((selectedDataPoint.total_orders / insights.totalOrders) * 100).toFixed(1)}% of total
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">Average Order Value</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(selectedDataPoint.total_orders > 0 ? selectedDataPoint.total_revenue / selectedDataPoint.total_orders : 0)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      For this {granularity.slice(0, -2)} period
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="revenue" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Revenue Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium">Total Revenue</span>
                        <span className="text-lg font-bold text-blue-600">
                          {formatCurrency(selectedDataPoint.total_revenue)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">Revenue per Order</span>
                        <span className="text-lg font-bold">
                          {formatCurrency(selectedDataPoint.total_orders > 0 ? selectedDataPoint.total_revenue / selectedDataPoint.total_orders : 0)}
                        </span>
                      </div>
                      
                      {insights && (
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <span className="font-medium">% of Total Period Revenue</span>
                          <span className="text-lg font-bold text-green-600">
                            {((selectedDataPoint.total_revenue / insights.totalRevenue) * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="orders" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Orders Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="font-medium">Total Orders</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatNumber(selectedDataPoint.total_orders)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">Average Order Value</span>
                        <span className="text-lg font-bold">
                          {formatCurrency(selectedDataPoint.total_orders > 0 ? selectedDataPoint.total_revenue / selectedDataPoint.total_orders : 0)}
                        </span>
                      </div>
                      
                      {insights && (
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <span className="font-medium">% of Total Period Orders</span>
                          <span className="text-lg font-bold text-blue-600">
                            {((selectedDataPoint.total_orders / insights.totalOrders) * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default RevenueOrdersChart