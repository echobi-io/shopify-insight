import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts'
import { getCustomerInsightsData, getCustomerDetails, CustomerInsightsData, ChurnPrediction, LtvPrediction, CohortData, CustomerCluster } from '@/lib/fetchers/getCustomerInsightsData'
import { exportToCSV } from '@/lib/utils/exportUtils'
import { getDateRangeFromTimeframe } from '@/lib/utils/dateUtils'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import ProtectedRoute from '@/components/ProtectedRoute'
import DateRangeSelector from '@/components/DateRangeSelector'
import HelpSection, { getCustomerInsightsHelpItems } from '@/components/HelpSection'
import { RefreshCw, AlertCircle } from 'lucide-react'

const HARDCODED_MERCHANT_ID = '11111111-1111-1111-1111-111111111111'

const CustomerInsightsPage: React.FC = () => {
  const [data, setData] = useState<CustomerInsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false)
  const [cohortPeriod, setCohortPeriod] = useState<'monthly' | 'quarterly'>('monthly')

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
  
  // Date filter states
  const [dateRange, setDateRange] = useState('financial_current')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  useEffect(() => {
    loadData()
  }, [dateRange, customStartDate, customEndDate])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get date range based on selection
      const dateFilters = getDateRangeFromTimeframe(dateRange, customStartDate, customEndDate)
      console.log('🔄 Loading customer insights data with date filters:', dateFilters)
      
      const result = await getCustomerInsightsData(HARDCODED_MERCHANT_ID, {
        startDate: dateFilters.startDate.toISOString(),
        endDate: dateFilters.endDate.toISOString()
      })
      setData(result)
    } catch (err) {
      console.error('Error loading customer insights data:', err)
      setError('Failed to load customer insights data')
    } finally {
      setLoading(false)
    }
  }

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
      'Revenue at Risk': `£${prediction.revenue_at_risk.toFixed(2)}`,
      'Total Spent': `£${prediction.customer?.total_spent?.toFixed(2) || '0.00'}`,
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
      'Cumulative Revenue': `£${cohort.cumulative_revenue.toFixed(2)}`,
      'Avg Revenue per Customer': `£${cohort.avg_revenue_per_customer.toFixed(2)}`
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

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-[240px]">
          <Header />
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-black mx-auto mb-4" />
              <p className="text-gray-600 font-light">Loading customer insights...</p>
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
            <p className="text-gray-600 font-light">Insufficient data to generate customer insights yet. We need at least 60 days of transaction data.</p>
          </div>
        </div>
      </div>
    )
  }

  const { transformedData: retentionData, uniqueCohorts: retentionCohorts } = transformCohortData(data.cohortAnalysis, 'retention_rate');
  const { transformedData: revenueData, uniqueCohorts: revenueCohorts } = transformCohortData(data.cohortAnalysis, 'avg_revenue_per_customer');

  const hasData = data.kpis.totalActiveCustomers > 0 || data.churnPredictions.length > 0 || data.ltvPredictions.length > 0;

  const pageContent = hasData ? (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="card-minimal">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-light text-gray-600">Total Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-black">{data.kpis.totalActiveCustomers}</div>
            <p className="text-xs font-light text-gray-500 mt-1">Active in last 60 days</p>
          </CardContent>
        </Card>

        <Card className="card-minimal">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-light text-gray-600">Customers at High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-red-600">{data.kpis.customersAtHighRisk}</div>
            <p className="text-xs font-light text-gray-500 mt-1">Likely to churn in 30 days</p>
          </CardContent>
        </Card>

        <Card className="card-minimal">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-light text-gray-600">Average LTV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-green-600">£{data.kpis.averageLtv.toFixed(0)}</div>
            <p className="text-xs font-light text-gray-500 mt-1">Predicted customer lifetime value</p>
          </CardContent>
        </Card>

        <Card className="card-minimal">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-light text-gray-600">Revenue at Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-orange-600">£{data.kpis.revenueAtRisk.toFixed(0)}</div>
            <p className="text-xs font-light text-gray-500 mt-1">High & medium risk customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different insights */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
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
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
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
              </CardContent>
            </Card>

            {/* Revenue Trend */}
            <Card className="card-minimal">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-black">Revenue at Risk Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.churnTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" fontSize={12} stroke="#666" />
                    <YAxis fontSize={12} stroke="#666" />
                    <Tooltip formatter={(value) => typeof value === 'number' ? [`£${value.toFixed(2)}`, 'Revenue at Risk'] : [null, null]} />
                    <Line type="monotone" dataKey="total_revenue_at_risk" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Customer Segments Summary */}
          <Card className="card-minimal">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-black">Customer Segments Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Segment</TableHead>
                    <TableHead>Customers</TableHead>
                    <TableHead>Avg Orders</TableHead>
                    <TableHead>Avg LTV</TableHead>
                    <TableHead>Avg Order Value</TableHead>
                    <TableHead>Active (30d)</TableHead>
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
                      <TableCell className="font-light">{segment.customers_count}</TableCell>
                      <TableCell className="font-light">{segment.avg_orders_per_customer.toFixed(1)}</TableCell>
                      <TableCell className="font-light">£{segment.avg_customer_ltv.toFixed(0)}</TableCell>
                      <TableCell className="font-light">£{segment.avg_order_value.toFixed(0)}</TableCell>
                      <TableCell className="font-light">{segment.active_last_30_days}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Churn Analysis Tab */}
        <TabsContent value="churn" className="space-y-6">
          <Card className="card-minimal">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-medium text-black">Churn Risk Analysis</CardTitle>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Churn Risk</TableHead>
                    <TableHead>Risk Band</TableHead>
                    <TableHead>Revenue at Risk</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Last Order</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChurnData.slice(0, 50).map((prediction) => (
                    <TableRow key={prediction.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {prediction.customer?.first_name} {prediction.customer?.last_name}
                          </div>
                          <div className="text-sm font-light text-gray-500">{prediction.customer?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{(prediction.churn_probability * 100).toFixed(1)}%</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRiskBadgeColor(prediction.churn_band)}>
                          {prediction.churn_band}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-light">£{prediction.revenue_at_risk.toFixed(2)}</TableCell>
                      <TableCell className="font-light">£{prediction.customer?.total_spent?.toFixed(2) || '0.00'}</TableCell>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs would follow the same pattern... */}
        <TabsContent value="cohort" className="space-y-6">
          <div className="text-center py-8">
            <p className="text-gray-600 font-light">Cohort analysis coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="ltv" className="space-y-6">
          <div className="text-center py-8">
            <p className="text-gray-600 font-light">LTV modeling coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-6">
          <div className="text-center py-8">
            <p className="text-gray-600 font-light">Customer segments coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="clusters" className="space-y-6">
          <div className="text-center py-8">
            <p className="text-gray-600 font-light">AI clusters coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </>
  ) : (
    <div className="text-center py-20">
      <p className="text-lg font-light text-gray-700">No customer insights data available for the selected period.</p>
      <p className="font-light text-gray-500">Try selecting a different date range.</p>
    </div>
  );

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
                <h1 className="text-3xl font-light text-black mb-2">Customer Insights</h1>
                <p className="text-gray-600 font-light">Customer analytics, churn prediction, and lifetime value modeling</p>
              </div>
              
              {/* Date Filter */}
              <div className="flex items-center space-x-4">
                <DateRangeSelector
                  value={dateRange}
                  onChange={setDateRange}
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

          {pageContent}
          
          {/* Help Section */}
          <HelpSection 
            title="Customer Insights Help & Information"
            items={getCustomerInsightsHelpItems()}
            defaultOpen={false}
            className="mt-8"
          />
        </div>
      </div>

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
                  <p className="font-light"><strong>Total Spent:</strong> £{selectedCustomer.customer.total_spent?.toFixed(2) || '0.00'}</p>
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
    </div>
  )
}

export default function CustomerInsights() {
  return (
    <ProtectedRoute>
      <CustomerInsightsPage />
    </ProtectedRoute>
  )
}