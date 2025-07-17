import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SalesOriginData, getChannelDisplayName, getChannelColor } from '@/lib/fetchers/getSalesOriginData'
import { formatCurrency } from '@/lib/utils/settingsUtils'
import { formatNumber } from '@/lib/utils/numberUtils'

interface SalesOriginChartProps {
  data: SalesOriginData[]
  currency?: string
  loading?: boolean
}

const SalesOriginChart: React.FC<SalesOriginChartProps> = ({ 
  data, 
  currency = 'USD',
  loading = false 
}) => {
  if (loading) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>Sales Origin by Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>Sales Origin by Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No sales origin data available
          </div>
        </CardContent>
      </Card>
    )
  }

  // Prepare data for charts with display names and colors
  const chartData = data.map(item => ({
    ...item,
    displayName: getChannelDisplayName(item.channel),
    color: getChannelColor(item.channel),
    name: getChannelDisplayName(item.channel) // For recharts
  }))

  // Custom tooltip for pie chart
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.displayName}</p>
          <p className="text-sm text-muted-foreground">
            {formatNumber(data.order_count)} orders ({data.percentage.toFixed(1)}%)
          </p>
          <p className="text-sm text-muted-foreground">
            Revenue: {formatCurrency(data.total_revenue, currency)}
          </p>
        </div>
      )
    }
    return null
  }

  // Custom tooltip for bar chart
  const BarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            Orders: {formatNumber(payload[0].value)}
          </p>
          <p className="text-sm text-muted-foreground">
            Revenue: {formatCurrency(data.total_revenue, currency)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>Sales Origin by Platform</CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribution of orders and revenue across different sales channels
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pie" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pie">Distribution</TabsTrigger>
            <TabsTrigger value="bar">Comparison</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pie" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="order_count"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="bar" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="displayName" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis yAxisId="orders" orientation="left" />
                  <YAxis yAxisId="revenue" orientation="right" />
                  <Tooltip content={<BarTooltip />} />
                  <Bar 
                    yAxisId="orders" 
                    dataKey="order_count" 
                    fill="#0ea5e9" 
                    name="Orders"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {chartData.slice(0, 3).map((item, index) => (
            <div key={item.channel} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-sm">{item.displayName}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatNumber(item.order_count)} orders ({item.percentage.toFixed(1)}%)
              </div>
              <div className="text-xs text-muted-foreground">
                {formatCurrency(item.total_revenue, currency)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default SalesOriginChart