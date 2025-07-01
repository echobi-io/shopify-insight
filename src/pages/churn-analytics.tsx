import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle, Users, DollarSign, RefreshCw, AlertCircle, Target, Calendar } from 'lucide-react'
import { getChurnLtvData, type ChurnAnalyticsData, type ChurnTrend, type RiskSegment } from '@/lib/fetchers/getChurnLtvData'
import { getDateRangeFromTimeframe, formatDateForSQL } from '@/lib/utils/dateUtils'
import { formatCurrency } from '@/lib/utils/settingsUtils'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import ProtectedRoute from '@/components/ProtectedRoute'
import DateRangeSelector from '@/components/DateRangeSelector'
import EnhancedKPICard from '@/components/EnhancedKPICard'
import HelpSection from '@/components/HelpSection'

const HARDCODED_MERCHANT_ID = '11111111-1111-1111-1111-111111111111'

const ChurnAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<ChurnAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [timeframe, setTimeframe] = useState('financial_current')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [riskFilter, setRiskFilter] = useState('all')
  const [segmentFilter, setSegmentFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [timeframe, customStartDate, customEndDate])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const dateRange = getDateRangeFromTimeframe(timeframe, customStartDate, customEndDate)
      const filters = {
        startDate: formatDateForSQL(dateRange.startDate),
        endDate: formatDateForSQL(dateRange.endDate)
      }

      console.log('🔄 Loading churn analytics data with filters:', filters)
      
      const result = await getChurnLtvData(HARDCODED_MERCHANT_ID, filters)
      setData(result)
    } catch (err) {
      console.error('Error loading churn analytics data:', err)
      setError('Failed to load churn analytics data')
    } finally {
      setLoading(false)
    }
  }

  const getChurnHelpItems = () => [
    {
      title: "Churn Rate Analysis",
      content: "Monitor customer churn rates over time to identify trends and patterns. Churn rate represents the percentage of customers who stop purchasing within a given period."
    },
    {
      title: "Risk Segmentation",
      content: "Customers are categorized into High, Medium, and Low risk segments based on their purchase behavior, recency, and engagement patterns."
    },
    {
      title: "Revenue at Risk",
      content: "Track the potential revenue loss from customers at risk of churning. This helps prioritize retention efforts on high-value customers."
    },
    {
      title: "Cohort Analysis",
      content: "Analyze customer retention by cohorts to understand how different customer groups behave over time and identify improvement opportunities."
    }
  ]

  // Filter customers based on selected filters
  const filteredCustomers = data?.customers.filter(customer => {
    const matchesRisk = riskFilter === 'all' || customer.riskLevel === riskFilter
    const matchesSegment = segmentFilter === 'all' || customer.segment === segmentFilter
    return matchesRisk && matchesSegment
  }) || []

  const riskLevels = ['High', 'Medium', 'Low']
  const segments = [...new Set(data?.customers.map(c => c.segment).filter(Boolean))] || []

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
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
              <p className="text-gray-600 font-light">Loading churn analytics...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-[240px]">
          <Header />
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
              <p className="text-red-600 mb-4 font-light">{error}</p>
              <Button onClick={loadData} className="font-light">Retry</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-[240px]">
          <Header />
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 font-light">No churn data available for the selected period.</p>
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
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light text-black mb-2">Churn Analytics</h1>
                <p className="text-gray-600 font-light">Customer retention analysis and churn risk assessment</p>
              </div>
              
              {/* Date Filter */}
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
                
                <Button 
                  onClick={loadData} 
                  variant="outline" 
                  size="sm"
                  disabled={loading}
                  className="font-light"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <EnhancedKPICard
              title="Overall Churn Rate"
              value={data.summary.churnRate}
              previousValue={data.summary.previousChurnRate}
              icon={<TrendingDown className="w-5 h-5" />}
              isMonetary={false}
            />
            <EnhancedKPICard
              title="Customers at Risk"
              value={data.summary.customersAtRisk}
              previousValue={data.summary.previousCustomersAtRisk}
              icon={<AlertTriangle className="w-5 h-5" />}
              isMonetary={false}
            />
            <EnhancedKPICard
              title="Revenue at Risk"
              value={data.summary.revenueAtRisk}
              previousValue={data.summary.previousRevenueAtRisk}
              icon={<DollarSign className="w-5 h-5" />}
              isMonetary={true}
            />
            <EnhancedKPICard
              title="Avg Customer LTV"
              value={data.summary.avgCustomerLTV}
              previousValue={data.summary.previousAvgCustomerLTV}
              icon={<Target className="w-5 h-5" />}
              isMonetary={true}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Churn Rate Trend */}
            <Card className="card-minimal">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-black">Churn Rate Trend</CardTitle>
                <CardDescription className="font-light text-gray-600">
                  Monthly churn rate over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.churnTrend.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.churnTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="month" 
                          fontSize={12}
                          stroke="#666"
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                        />
                        <YAxis fontSize={12} stroke="#666" tickFormatter={(value) => `${value}%`} />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          formatter={(value: any) => [`${value.toFixed(1)}%`, 'Churn Rate']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="churnRate" 
                          stroke="#ef4444" 
                          fill="#ef4444" 
                          fillOpacity={0.1}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-light text-gray-500">No trend data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Risk Distribution */}
            <Card className="card-minimal">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-black">Risk Distribution</CardTitle>
                <CardDescription className="font-light text-gray-600">
                  Customer distribution by churn risk level
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.riskSegments.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.riskSegments}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ riskLevel, percentage }) => `${riskLevel}: ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="customerCount"
                        >
                          {data.riskSegments.map((entry, index) => {
                            const colors = { 'High': '#ef4444', 'Medium': '#f59e0b', 'Low': '#10b981' }
                            return (
                              <Cell key={`cell-${index}`} fill={colors[entry.riskLevel as keyof typeof colors] || '#6b7280'} />
                            )
                          })}
                        </Pie>
                        <Tooltip formatter={(value: any) => [value, 'Customers']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-light text-gray-500">No risk data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Revenue at Risk by Segment */}
          <Card className="card-minimal mb-8">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-black">Revenue at Risk by Segment</CardTitle>
              <CardDescription className="font-light text-gray-600">
                Potential revenue loss breakdown by risk level
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.riskSegments.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.riskSegments}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="riskLevel" fontSize={12} stroke="#666" />
                      <YAxis fontSize={12} stroke="#666" tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value: any) => [formatCurrency(value), 'Revenue at Risk']} />
                      <Bar dataKey="revenueAtRisk" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-light text-gray-500">No revenue data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Risk Table */}
          <Card className="card-minimal mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-medium text-black">Customer Risk Analysis</CardTitle>
                  <CardDescription className="font-light text-gray-600">
                    Detailed risk assessment for individual customers
                  </CardDescription>
                </div>
                
                {/* Filters */}
                <div className="flex items-center space-x-4">
                  <Select value={riskFilter} onValueChange={setRiskFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Risk Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Risk</SelectItem>
                      {riskLevels.map(risk => (
                        <SelectItem key={risk} value={risk}>{risk} Risk</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Segment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Segments</SelectItem>
                      {segments.map(segment => (
                        <SelectItem key={segment} value={segment}>{segment}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredCustomers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Segment</TableHead>
                        <TableHead>Risk Level</TableHead>
                        <TableHead className="text-right">LTV</TableHead>
                        <TableHead className="text-right">Revenue at Risk</TableHead>
                        <TableHead className="text-right">Days Since Last Order</TableHead>
                        <TableHead className="text-right">Total Orders</TableHead>
                        <TableHead>Last Order Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.slice(0, 50).map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-black">{customer.name}</div>
                              <div className="text-sm font-light text-gray-500">{customer.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-light">
                              {customer.segment}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRiskBadgeColor(customer.riskLevel)}>
                              {customer.riskLevel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-light">
                            {formatCurrency(customer.ltv)}
                          </TableCell>
                          <TableCell className="text-right font-light">
                            {formatCurrency(customer.revenueAtRisk)}
                          </TableCell>
                          <TableCell className="text-right font-light">
                            <span className={`${
                              customer.daysSinceLastOrder > 90 ? 'text-red-600' :
                              customer.daysSinceLastOrder > 60 ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {customer.daysSinceLastOrder} days
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-light">
                            {customer.totalOrders}
                          </TableCell>
                          <TableCell className="font-light">
                            {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'Never'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-light">No customers found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help Section */}
          <HelpSection 
            title="Churn Analytics Help & Information"
            items={getChurnHelpItems()}
            defaultOpen={false}
          />
        </div>
      </div>
    </div>
  )
}

export default function ChurnAnalytics() {
  return (
    <ProtectedRoute>
      <ChurnAnalyticsPage />
    </ProtectedRoute>
  )
}