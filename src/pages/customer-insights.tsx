import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter, AreaChart, Area } from 'recharts'
import { getCustomerInsightsData, getCustomerDetails, CustomerInsightsData, ChurnPrediction, LtvPrediction, CohortData, CustomerCluster, ClusterAnalysis } from '@/lib/fetchers/getCustomerInsightsData'
import { BusinessCustomerSegment, BusinessSegmentationData } from '@/lib/fetchers/getBusinessCustomerSegments'
import { getKPIs, getPreviousYearKPIs, type KPIData } from '@/lib/fetchers/getKpis'
import { exportToCSV } from '@/lib/utils/exportUtils'
import { getDateRangeFromTimeframe, formatDateForSQL } from '@/lib/utils/dateUtils'
import { formatCurrency, getInitialTimeframe } from '@/lib/utils/settingsUtils'
import AppLayout from '@/components/Layout/AppLayout'
import PageHeader from '@/components/Layout/PageHeader'
import PageFilters from '@/components/Layout/PageFilters'
import EnhancedKPICard from '@/components/EnhancedKPICard'
import HelpSection, { getCustomerInsightsHelpItems } from '@/components/HelpSection'
import InteractiveClusterChart from '@/components/InteractiveClusterChart'
import { RefreshCw, AlertCircle, Users, TrendingDown, DollarSign, Target, AlertTriangle, Calendar, Mail, Phone, Star, Shield, Search, Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'



const CustomerInsightsPage: React.FC = () => {
  // Data states
  const [data, setData] = useState<CustomerInsightsData | null>(null)
  const [enhancedKpis, setEnhancedKpis] = useState<KPIData | null>(null)
  const [previousYearKpis, setPreviousYearKpis] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false)
  const [cohortPeriod, setCohortPeriod] = useState<'monthly' | 'quarterly'>('monthly')
  
  // Use hardcoded merchant ID for demo
  const merchantId = '11111111-1111-1111-1111-111111111111'

  // Filter states
  const [timeframe, setTimeframe] = useState(getInitialTimeframe())
  const [granularity, setGranularity] = useState('monthly')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

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

      console.log('🔄 Loading customer insights data with filters:', filters)
      
      if (!merchantId) return
      // Load all data in parallel
      const [customerData, currentKpis, previousKpis] = await Promise.all([
        getCustomerInsightsData(merchantId, {
          startDate: filters.startDate,
          endDate: filters.endDate
        }),
        getKPIs(filters, merchantId).catch(err => {
          console.error('❌ Error loading current KPIs:', err)
          return null
        }),
        getPreviousYearKPIs(filters, merchantId).catch(err => {
          console.error('❌ Error loading previous year KPIs:', err)
          return null
        })
      ])
      
      setData(customerData)
      setEnhancedKpis(currentKpis)
      setPreviousYearKpis(previousKpis)
    } catch (err) {
      console.error('Error loading customer insights data:', err)
      setError('Failed to load customer insights data')
    } finally {
      setLoading(false)
    }
  }

  const transformCohortData = (cohortData: CohortData[], dataKey: 'retention_rate' | 'avg_revenue_per_customer') => {
    if (!cohortData || cohortData.length === 0) return { transformedData: [], uniqueCohorts: [] };

    const transformed: { [period: number]: { period_month: number, [cohort: string]: number } } = {};
    const uniqueCohorts = [...new Set(cohortData.map(item => item.cohort_month))].sort((a,b) => new Date(b).getTime() - new Date(a).getTime());

    cohortData.forEach(item => {
        const { cohort_month, period_month } = item;
        const value = item[dataKey];

        if (transformed[period_month] === undefined) {
            transformed[period_month] = { period_month };
        }
        transformed[period_month][cohort_month] = value;
    });

    return {
      transformedData: Object.values(transformed).sort((a, b) => a.period_month - b.period_month),
      uniqueCohorts
    };
  };

  const handleCustomerClick = async (customerId: string) => {
    try {
      const details = await getCustomerDetails(customerId)
      setSelectedCustomer(details)
      setCustomerDetailsOpen(true)
    } catch (err) {
      console.error('Error loading customer details:', err)
    }
  }

  const filteredChurnData = data?.churnPredictions.filter(prediction => {
    const matchesRisk = riskFilter === 'all' || prediction.churn_band === riskFilter
    const matchesSearch = searchTerm === '' || 
      prediction.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${prediction.customer?.first_name} ${prediction.customer?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesRisk && matchesSearch
  }) || []

  const exportChurnData = () => {
    if (!data) return
    
    const exportData = filteredChurnData.map(prediction => ({
      'Customer Email': prediction.customer?.email || '',
      'Customer Name': `${prediction.customer?.first_name || ''} ${prediction.customer?.last_name || ''}`.trim(),
      'Churn Risk %': `${(prediction.churn_probability * 100).toFixed(1)}%`,
      'Risk Band': prediction.churn_band,
      'Revenue at Risk': formatCurrency(prediction.revenue_at_risk),
      'Total Spent': formatCurrency(prediction.customer?.total_spent || 0),
      'Last Order': prediction.customer?.last_order_date ? new Date(prediction.customer.last_order_date).toLocaleDateString() : 'Never'
    }))
    
    exportToCSV(exportData, 'churn-predictions')
  }

  const exportCohortData = () => {
    if (!data) return
    
    const exportData = data.cohortAnalysis.map(cohort => ({
      'Cohort Month': cohort.cohort_month,
      'Period': cohort.period_month,
      'Customers Remaining': cohort.customers_remaining,
      'Retention Rate': `${cohort.retention_rate.toFixed(1)}%`,
      'Cumulative Revenue': formatCurrency(cohort.cumulative_revenue),
      'Avg Revenue per Customer': formatCurrency(cohort.avg_revenue_per_customer)
    }))
    
    exportToCSV(exportData, 'cohort-analysis')
  }

  const getRiskBadgeColor = (band: string) => {
    switch (band) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getClusterColor = (index: number) => {
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']
    return colors[index % colors.length]
  }

  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']

  // Only compute these if we have data
  const { transformedData: retentionData, uniqueCohorts: retentionCohorts } = data ? transformCohortData(data.cohortAnalysis, 'retention_rate') : { transformedData: [], uniqueCohorts: [] };
  const { transformedData: revenueData, uniqueCohorts: revenueCohorts } = data ? transformCohortData(data.cohortAnalysis, 'avg_revenue_per_customer') : { transformedData: [], uniqueCohorts: [] };

  const hasData = data ? (data.kpis.totalActiveCustomers > 0 || data.churnPredictions.length > 0 || data.ltvPredictions.length > 0) : false;

  const pageContent = hasData ? (
    <>
      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <EnhancedKPICard
          title="Total Active Customers"
          value={data.kpis.totalActiveCustomers}
          previousValue={previousYearKpis?.totalCustomers}
          icon={<Users className="w-5 h-5" />}
          isMonetary={false}
        />
        <EnhancedKPICard
          title="Customers at High Risk"
          value={data.kpis.customersAtHighRisk}
          icon={<AlertTriangle className="w-5 h-5" />}
          isMonetary={false}
        />
        <EnhancedKPICard
          title="Average LTV"
          value={data.kpis.averageLtv}
          previousValue={previousYearKpis?.avgCustomerLTV}
          icon={<Target className="w-5 h-5" />}
          isMonetary={true}
        />
        <EnhancedKPICard
          title="Revenue at Risk"
          value={data.kpis.revenueAtRisk}
          icon={<DollarSign className="w-5 h-5" />}
          isMonetary={true}
        />
      </div>

      {/* Tabs for different insights */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="business-segments">Business Segments</TabsTrigger>
          <TabsTrigger value="churn">Churn Analysis</TabsTrigger>
          <TabsTrigger value="cohort">Cohort Analysis</TabsTrigger>
          <TabsTrigger value="ltv">LTV Modeling</TabsTrigger>
          <TabsTrigger value="segments">Customer Segments</TabsTrigger>
          <TabsTrigger value="clusters">AI Clusters</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Distribution */}
            <Card className="card-minimal">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-black">Customer Distribution by Segment</CardTitle>
                <CardDescription className="font-light text-gray-600">
                  Customer breakdown by calculated segments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.customerSegments.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.customerSegments}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name.replace(/_/g, ' ')} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="customers_count"
                          nameKey="calculated_segment"
                        >
                          {data.customerSegments.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-light text-gray-500">No segment data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue Trend - Only show if we have churn data */}
            {data.churnPredictions.length > 0 && data.churnTrendData.length > 0 ? (
              <Card className="card-minimal">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-black">Revenue at Risk Trend</CardTitle>
                  <CardDescription className="font-light text-gray-600">
                    Potential revenue loss from at-risk customers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.churnTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          fontSize={12} 
                          stroke="#666"
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis fontSize={12} stroke="#666" tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          formatter={(value: any) => [formatCurrency(value), 'Revenue at Risk']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="total_revenue_at_risk" 
                          stroke="#ef4444" 
                          fill="#ef4444" 
                          fillOpacity={0.1}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="card-minimal">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-black">Revenue at Risk Trend</CardTitle>
                  <CardDescription className="font-light text-gray-600">
                    Potential revenue loss from at-risk customers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-light text-gray-500">No churn prediction data available</p>
                      <p className="text-xs font-light text-gray-400 mt-1">Revenue at risk trends require churn prediction data</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Customer Segments Summary */}
          <Card className="card-minimal">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-black">Customer Segments Performance</CardTitle>
              <CardDescription className="font-light text-gray-600">
                Detailed performance metrics by customer segment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.customerSegments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Segment</TableHead>
                        <TableHead className="text-right">Customers</TableHead>
                        <TableHead className="text-right">Avg Orders</TableHead>
                        <TableHead className="text-right">Avg LTV</TableHead>
                        <TableHead className="text-right">Avg Order Value</TableHead>
                        <TableHead className="text-right">Active (30d)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.customerSegments.map((segment) => (
                        <TableRow key={segment.calculated_segment}>
                          <TableCell>
                            <Badge variant="outline" className="capitalize font-light">
                              {segment.calculated_segment.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-light">{segment.customers_count}</TableCell>
                          <TableCell className="text-right font-light">{segment.avg_orders_per_customer.toFixed(1)}</TableCell>
                          <TableCell className="text-right font-light">{formatCurrency(segment.avg_customer_ltv)}</TableCell>
                          <TableCell className="text-right font-light">{formatCurrency(segment.avg_order_value)}</TableCell>
                          <TableCell className="text-right font-light">{segment.active_last_30_days}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-light">No segment data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Segments Tab */}
        <TabsContent value="business-segments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Business Segment Distribution */}
            <Card className="card-minimal">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-black">Business Customer Segments</CardTitle>
                <CardDescription className="font-light text-gray-600">
                  Customer distribution based on business segmentation logic
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.businessSegments.segments.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.businessSegments.segmentDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ segment_name, percentage }) => `${segment_name.replace(/_/g, ' ')} ${percentage.toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="customer_count"
                          nameKey="segment_name"
                        >
                          {data.businessSegments.segmentDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any, name: any) => [value, name.replace(/_/g, ' ')]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-light text-gray-500">No business segment data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Segment Revenue Performance */}
            <Card className="card-minimal">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-black">Revenue by Business Segment</CardTitle>
                <CardDescription className="font-light text-gray-600">
                  Total revenue contribution by each business segment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.businessSegments.segments.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.businessSegments.segments}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="segment_name" 
                          fontSize={12} 
                          stroke="#666"
                          tickFormatter={(value) => value.replace(/_/g, ' ').replace('customers', '')}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis fontSize={12} stroke="#666" tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip 
                          formatter={(value: any) => [formatCurrency(value), 'Total Revenue']}
                          labelFormatter={(value) => value.replace(/_/g, ' ')}
                        />
                        <Bar dataKey="total_revenue" fill="#14b8a6" />
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
          </div>

          {/* Business Segments Summary Table */}
          <Card className="card-minimal">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-black">Business Segment Performance</CardTitle>
              <CardDescription className="font-light text-gray-600">
                Detailed metrics for each business customer segment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.businessSegments.segments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Segment</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Customers</TableHead>
                        <TableHead className="text-right">Total Revenue</TableHead>
                        <TableHead className="text-right">Avg Order Value</TableHead>
                        <TableHead className="text-right">Avg Orders</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.businessSegments.segments.map((segment) => (
                        <TableRow key={segment.segment_name}>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={`capitalize font-light ${
                                segment.segment_name === 'best_customers' ? 'bg-green-50 text-green-700 border-green-200' :
                                segment.segment_name === 'loyal_customers' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                segment.segment_name === 'promising_customers' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                segment.segment_name === 'recent_customers' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                segment.segment_name === 'defecting_customers' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                segment.segment_name === 'at_risk_customers' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                              }`}
                            >
                              {segment.segment_name.replace(/_/g, ' ').replace('customers', '')}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-light text-sm max-w-xs">
                            {segment.segment_description}
                          </TableCell>
                          <TableCell className="text-right font-light">{segment.customer_count}</TableCell>
                          <TableCell className="text-right font-light">{formatCurrency(segment.total_revenue)}</TableCell>
                          <TableCell className="text-right font-light">{formatCurrency(segment.avg_order_value)}</TableCell>
                          <TableCell className="text-right font-light">{segment.avg_orders_per_customer.toFixed(1)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-light">No business segment data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Details by Segment */}
          {data.businessSegments.segments.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {data.businessSegments.segments.slice(0, 6).map((segment) => (
                <Card key={segment.segment_name} className="card-minimal">
                  <CardHeader>
                    <CardTitle className="text-base font-medium text-black capitalize">
                      {segment.segment_name.replace(/_/g, ' ')}
                    </CardTitle>
                    <CardDescription className="font-light text-gray-600 text-sm">
                      {segment.customer_count} customers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {segment.customers.slice(0, 5).map((customer) => (
                        <div key={customer.customer_id} className="flex justify-between items-center py-1">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-black truncate">
                              {customer.customer_name}
                            </p>
                            <p className="text-xs font-light text-gray-500 truncate">
                              {customer.customer_email}
                            </p>
                          </div>
                          <div className="text-right ml-2">
                            <p className="text-sm font-light">{formatCurrency(customer.total_spent)}</p>
                            <p className="text-xs font-light text-gray-500">{customer.order_count} orders</p>
                          </div>
                        </div>
                      ))}
                      {segment.customers.length > 5 && (
                        <p className="text-xs font-light text-gray-500 text-center pt-2">
                          +{segment.customers.length - 5} more customers
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Churn Analysis Tab */}
        <TabsContent value="churn" className="space-y-6">
          <Card className="card-minimal">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-medium text-black">Churn Risk Analysis</CardTitle>
                  <CardDescription className="font-light text-gray-600">
                    AI-powered customer churn predictions and risk assessment
                  </CardDescription>
                </div>
                <div className="flex gap-4">
                  <Select value={riskFilter} onValueChange={setRiskFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Risk Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Risk</SelectItem>
                      <SelectItem value="High">High Risk</SelectItem>
                      <SelectItem value="Medium">Medium Risk</SelectItem>
                      <SelectItem value="Low">Low Risk</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-48"
                  />
                  <Button onClick={exportChurnData} variant="outline" className="font-light">
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredChurnData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Churn Risk</TableHead>
                        <TableHead>Risk Band</TableHead>
                        <TableHead className="text-right">Revenue at Risk</TableHead>
                        <TableHead className="text-right">Total Spent</TableHead>
                        <TableHead>Last Order</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredChurnData.slice(0, 50).map((prediction) => (
                        <TableRow key={prediction.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-black">
                                {prediction.customer?.first_name} {prediction.customer?.last_name}
                              </div>
                              <div className="text-sm font-light text-gray-500">{prediction.customer?.email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-medium">{(prediction.churn_probability * 100).toFixed(1)}%</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRiskBadgeColor(prediction.churn_band)}>
                              {prediction.churn_band}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-light">{formatCurrency(prediction.revenue_at_risk)}</TableCell>
                          <TableCell className="text-right font-light">{formatCurrency(prediction.customer?.total_spent || 0)}</TableCell>
                          <TableCell className="font-light">
                            {prediction.customer?.last_order_date 
                              ? new Date(prediction.customer.last_order_date).toLocaleDateString()
                              : 'Never'
                            }
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCustomerClick(prediction.customer_id)}
                              className="font-light"
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-light">No churn predictions available for the selected criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cohort Analysis Tab */}
        <TabsContent value="cohort" className="space-y-6">
          <Card className="card-minimal">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-medium text-black">Cohort Analysis</CardTitle>
                  <CardDescription className="font-light text-gray-600">
                    Customer retention and revenue analysis by cohorts
                  </CardDescription>
                </div>
                <Button onClick={exportCohortData} variant="outline" className="font-light">
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {data.cohortAnalysis.length > 0 ? (
                <div className="space-y-6">
                  {/* Retention Rate Chart */}
                  <div>
                    <h3 className="text-lg font-medium text-black mb-4">Retention Rate by Cohort</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={retentionData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="period_month" fontSize={12} stroke="#666" />
                          <YAxis fontSize={12} stroke="#666" tickFormatter={(value) => `${value}%`} />
                          <Tooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Retention Rate']} />
                          {retentionCohorts.slice(0, 6).map((cohort, index) => (
                            <Line
                              key={cohort}
                              type="monotone"
                              dataKey={cohort}
                              stroke={COLORS[index % COLORS.length]}
                              strokeWidth={2}
                              dot={false}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Cohort Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cohort Month</TableHead>
                          <TableHead className="text-right">Period</TableHead>
                          <TableHead className="text-right">Customers Remaining</TableHead>
                          <TableHead className="text-right">Retention Rate</TableHead>
                          <TableHead className="text-right">Cumulative Revenue</TableHead>
                          <TableHead className="text-right">Avg Revenue per Customer</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.cohortAnalysis.slice(0, 20).map((cohort, index) => (
                          <TableRow key={`${cohort.cohort_month}-${cohort.period_month}`}>
                            <TableCell className="font-light">{cohort.cohort_month}</TableCell>
                            <TableCell className="text-right font-light">{cohort.period_month}</TableCell>
                            <TableCell className="text-right font-light">{cohort.customers_remaining}</TableCell>
                            <TableCell className="text-right font-light">{cohort.retention_rate.toFixed(1)}%</TableCell>
                            <TableCell className="text-right font-light">{formatCurrency(cohort.cumulative_revenue)}</TableCell>
                            <TableCell className="text-right font-light">{formatCurrency(cohort.avg_revenue_per_customer)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-light">No cohort data available for the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LTV Modeling Tab */}
        <TabsContent value="ltv" className="space-y-6">
          <Card className="card-minimal">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-black">Customer Lifetime Value Predictions</CardTitle>
              <CardDescription className="font-light text-gray-600">
                AI-powered LTV predictions for customer segments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.ltvPredictions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Predicted LTV</TableHead>
                        <TableHead className="text-right">Current Spent</TableHead>
                        <TableHead className="text-right">Potential Value</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Segment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.ltvPredictions.slice(0, 50).map((prediction) => (
                        <TableRow key={prediction.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-black">
                                {prediction.customer?.first_name} {prediction.customer?.last_name}
                              </div>
                              <div className="text-sm font-light text-gray-500">{prediction.customer?.email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-light">{formatCurrency(prediction.predicted_ltv)}</TableCell>
                          <TableCell className="text-right font-light">{formatCurrency(prediction.customer?.total_spent || 0)}</TableCell>
                          <TableCell className="text-right font-light">
                            {formatCurrency(Math.max(0, prediction.predicted_ltv - (prediction.customer?.total_spent || 0)))}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-light">
                              {prediction.confidence_score > 0.8 ? 'High' : 
                               prediction.confidence_score > 0.6 ? 'Medium' : 'Low'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-light">{prediction.ltv_segment}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-light">No LTV predictions available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Segments Tab */}
        <TabsContent value="segments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Segment Performance Chart */}
            <Card className="card-minimal">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-black">Segment Revenue Distribution</CardTitle>
                <CardDescription className="font-light text-gray-600">
                  Revenue contribution by customer segment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.customerSegments.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.customerSegments}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="calculated_segment" 
                          fontSize={12} 
                          stroke="#666"
                          tickFormatter={(value) => value.replace('_', ' ')}
                        />
                        <YAxis fontSize={12} stroke="#666" tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip 
                          formatter={(value: any) => [formatCurrency(value), 'Avg LTV']}
                          labelFormatter={(value) => value.replace('_', ' ')}
                        />
                        <Bar dataKey="avg_customer_ltv" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-light text-gray-500">No segment data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Segment Activity Chart */}
            <Card className="card-minimal">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-black">Segment Activity Levels</CardTitle>
                <CardDescription className="font-light text-gray-600">
                  Active customers by segment (last 30 days)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.customerSegments.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.customerSegments}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="calculated_segment" 
                          fontSize={12} 
                          stroke="#666"
                          tickFormatter={(value) => value.replace('_', ' ')}
                        />
                        <YAxis fontSize={12} stroke="#666" />
                        <Tooltip 
                          formatter={(value: any) => [value, 'Active Customers']}
                          labelFormatter={(value) => value.replace('_', ' ')}
                        />
                        <Bar dataKey="active_last_30_days" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-light text-gray-500">No activity data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Clusters Tab - Now using the Interactive Component */}
        <TabsContent value="clusters" className="space-y-6">
          {data.clusterAnalysis && data.clusterAnalysis.customerPoints.length > 0 ? (
            <InteractiveClusterChart 
              clusterAnalysis={data.clusterAnalysis}
              onCustomerClick={handleCustomerClick}
            />
          ) : (
            <Card className="card-minimal">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-black">AI-Generated Customer Clusters</CardTitle>
                <CardDescription className="font-light text-gray-600">
                  Machine learning-based customer clustering analysis with individual customer positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-light">No cluster data available</p>
                  <p className="text-sm text-gray-500 font-light mt-2">
                    Cluster analysis requires customers with order history
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </>
  ) : (
    <div className="text-center py-20">
      <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <p className="text-lg font-light text-gray-700">No customer insights data available for the selected period.</p>
      <p className="font-light text-gray-500">Try selecting a different date range or check back once you have more transaction data.</p>
    </div>
  );

  return (
    <AppLayout loading={loading} loadingMessage="Loading customer insights...">
      <PageHeader
        title="Customer Insights"
        description="Customer analytics, churn prediction, and lifetime value modeling"
        onRefresh={loadData}
        loading={loading}
        actions={
          <PageFilters
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomStartDateChange={setCustomStartDate}
            onCustomEndDateChange={setCustomEndDate}
            granularity={granularity}
            onGranularityChange={setGranularity}
          />
        }
      />

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800 font-light">{error}</p>
          </div>
        </div>
      )}

      {!data ? (
        <div className="text-center py-20">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-light text-gray-700">Insufficient data to generate customer insights yet.</p>
          <p className="font-light text-gray-500">We need at least 60 days of transaction data.</p>
        </div>
      ) : (
        <>
          {pageContent}
          
          {/* Help Section */}
          <HelpSection 
            title="Customer Insights Help & Information"
            items={getCustomerInsightsHelpItems()}
            defaultOpen={false}
            className="mt-8"
          />
        </>
      )}

      {/* Customer Details Modal */}
      <Dialog open={customerDetailsOpen} onOpenChange={setCustomerDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-medium">Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Customer Information</h3>
                  <p className="font-light"><strong>Name:</strong> {selectedCustomer.customer.first_name} {selectedCustomer.customer.last_name}</p>
                  <p className="font-light"><strong>Email:</strong> {selectedCustomer.customer.email}</p>
                  <p className="font-light"><strong>Total Spent:</strong> {formatCurrency(selectedCustomer.customer.total_spent || 0)}</p>
                  <p className="font-light"><strong>Orders Count:</strong> {selectedCustomer.customer.orders_count || 0}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Risk Metrics</h3>
                  <p className="font-light"><strong>Segment:</strong> {selectedCustomer.customer.customer_segment}</p>
                  <p className="font-light"><strong>Last Order:</strong> {selectedCustomer.customer.last_order_date ? new Date(selectedCustomer.customer.last_order_date).toLocaleDateString() : 'Never'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}

export default function CustomerInsights() {
  return (
    <ProtectedRoute>
      <CustomerInsightsPage />
    </ProtectedRoute>
  )
}