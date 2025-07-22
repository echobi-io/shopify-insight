import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/settingsUtils'
import { sanitizeChartData, formatChartDateLabel, formatChartTooltipLabel } from '@/lib/utils/chartDateUtils'

interface ChartDataPoint {
  date: string
  total_revenue: number
  total_orders: number
}

interface SimpleRevenueChartProps {
  data: ChartDataPoint[]
  granularity: string
  currency?: string
  loading?: boolean
  className?: string
}

const SimpleRevenueChart: React.FC<SimpleRevenueChartProps> = ({
  data,
  granularity,
  currency = 'GBP',
  loading = false,
  className = ''
}) => {
  console.log('🔍 SimpleRevenueChart Debug:', {
    dataLength: data?.length || 0,
    data: data?.slice(0, 3),
    granularity,
    currency,
    loading
  })

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  // Sanitize chart data to prevent moment.js deprecation warnings
  const sanitizedData = useMemo(() => {
    return sanitizeChartData(data || [], 'date')
  }, [data])

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

  // Calculate totals for summary
  const totalRevenue = data.reduce((sum, point) => sum + (point.total_revenue || 0), 0)
  const totalOrders = data.reduce((sum, point) => sum + (point.total_orders || 0), 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  return (
    <Card className={`${className} hover:shadow-lg transition-shadow duration-200`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Revenue & Orders Performance
        </CardTitle>
        <CardDescription>
          {granularity.charAt(0).toUpperCase() + granularity.slice(1)} performance overview
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-blue-600 font-medium mb-1">Total Revenue</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-green-600 font-medium mb-1">Total Orders</p>
            <p className="text-lg font-bold text-gray-900">{formatNumber(totalOrders)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-purple-600 font-medium mb-1">Avg Order Value</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(avgOrderValue)}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sanitizedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                stroke="#666"
                tickFormatter={(value) => formatChartDateLabel(value, granularity)}
              />
              <YAxis yAxisId="revenue" orientation="left" fontSize={12} stroke="#3b82f6" />
              <YAxis yAxisId="orders" orientation="right" fontSize={12} stroke="#10b981" />
              <Tooltip 
                labelFormatter={(value) => formatChartTooltipLabel(value, granularity)}
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
                name="Revenue"
              />
              <Line 
                yAxisId="orders"
                type="monotone" 
                dataKey="total_orders" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                name="Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default SimpleRevenueChart