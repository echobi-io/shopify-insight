import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts'
import { getCustomerInsightsData, getCustomerDetails, CustomerInsightsData, ChurnPrediction, LtvPrediction, CohortData, CustomerCluster } from '@/lib/fetchers/getCustomerInsightsData'
import { exportToCSV } from '@/lib/utils/exportUtils'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext'
import { Calendar, HelpCircle } from 'lucide-react'
import GraphExplanationModal from '@/components/GraphExplanationModal'

const HARDCODED_MERCHANT_ID = '11111111-1111-1111-1111-111111111111'

const CustomerInsightsPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<CustomerInsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false)
  const [cohortPeriod, setCohortPeriod] = useState<'monthly' | 'quarterly'>('monthly')
  const [graphExplanationOpen, setGraphExplanationOpen] = useState(false)

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
  const [dateRange, setDateRange] = useState('last_90_days')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Date range options
  const timeframeOptions = [
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'last_90_days', label: 'Last 90 Days' },
    { value: 'last_6_months', label: 'Last 6 Months' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'this_month', label: 'This Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'all_2024', label: 'All of 2024' },
    { value: 'all_2023', label: 'All of 2023' },
    { value: 'custom', label: 'Custom Range' }
  ]

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
      
      const result = await getCustomerInsightsData(HARDCODED_MERCHANT_ID, dateFilters)
      setData(result)
    } catch (err) {
      console.error('Error loading customer insights data:', err)
      setError('Failed to load customer insights data')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get date range
  const getDateRangeFromTimeframe = (timeframe: string, startDate?: string, endDate?: string) => {
    const now = new Date()
    let start: Date
    let end: Date = now

    switch (timeframe) {
      case 'last_7_days':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'last_30_days':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'last_90_days':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'last_6_months':
        start = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        break
      case 'last_year':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1)
        break
      case 'all_2024':
        start = new Date('2024-01-01')
        end = new Date('2024-12-31T23:59:59.999Z')
        break
      case 'all_2023':
        start = new Date('2023-01-01')
        end = new Date('2023-12-31T23:59:59.999Z')
        break
      case 'custom':
        if (startDate && endDate) {
          start = new Date(startDate)
          end = new Date(endDate)
        } else {
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }
        break
      default:
        start = new Date('2024-01-01')
        end = new Date('2024-12-31T23:59:59.999Z')
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    }
  }

  const handleSectionChange = (section: string) => {
    if (section === 'customer-insights') {
      // Stay on current page
      return
    } else if (section === 'sales-analysis') {
      router.push('/sales-analysis')
    } else if (section === 'dashboard') {
      router.push('/dashboard')
    } else {
      router.push(`/dashboard?section=${section}`)
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
        <Sidebar activeSection="customer-insights" onSectionChange={handleSectionChange} />
        <div className="flex-1 ml-[220px]">
          <Header />
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading customer insights...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activeSection="customer-insights" onSectionChange={handleSectionChange} />
        <div className="flex-1 ml-[220px]">
          <Header />
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadData}>Retry</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activeSection="customer-insights" onSectionChange={handleSectionChange} />
        <div className="flex-1 ml-[220px]">
          <Header />
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600">Insufficient data to generate customer insights yet. We need at least 60 days of transaction data.</p>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Active Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{data.kpis.totalActiveCustomers}</div>
              <p className="text-xs text-gray-500 mt-1">Active in last 60 days</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Customers at High Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data.kpis.customersAtHighRisk}</div>
              <p className="text-xs text-gray-500 mt-1">Likely to churn in 30 days</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Average LTV</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">£{data.kpis.averageLtv.toFixed(0)}</div>
              <p className="text-xs text-gray-500 mt-1">Predicted customer lifetime value</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Revenue at Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">£{data.kpis.revenueAtRisk.toFixed(0)}</div>
              <p className="text-xs text-gray-500 mt-1">High & medium risk customers</p>
            </CardContent>
          </Card>
        </motion.div>
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
            <Card>
              <CardHeader>
                <CardTitle>Customer Distribution by Segment</CardTitle>
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
            <Card>
              <CardHeader>
                <CardTitle>Revenue at Risk Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.churnTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => typeof value === 'number' ? [`£${value.toFixed(2)}`, 'Revenue at Risk'] : [null, null]} />
                    <Line type="monotone" dataKey="total_revenue_at_risk" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Customer Segments Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Segments Performance</CardTitle>
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
                        <Badge variant="outline" className="capitalize">
                          {segment.calculated_segment.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{segment.customers_count}</TableCell>
                      <TableCell>{segment.avg_orders_per_customer.toFixed(1)}</TableCell>
                      <TableCell>£{segment.avg_customer_ltv.toFixed(0)}</TableCell>
                      <TableCell>£{segment.avg_order_value.toFixed(0)}</TableCell>
                      <TableCell>{segment.active_last_30_days}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Churn Analysis Tab */}
        <TabsContent value="churn" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Churn Risk Analysis</CardTitle>
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
                  <Button onClick={exportChurnData} variant="outline">
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
                          <div className="text-sm text-gray-500">{prediction.customer?.email}</div>
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
                      <TableCell>£{prediction.revenue_at_risk.toFixed(2)}</TableCell>
                      <TableCell>£{prediction.customer?.total_spent?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
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

        {/* Cohort Analysis Tab */}
        <TabsContent value="cohort" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Cohort Analysis</h3>
              <p className="text-gray-600">Track customer retention and revenue by signup period</p>
            </div>
            <div className="flex gap-4">
              <Select value={cohortPeriod} onValueChange={(value: 'monthly' | 'quarterly') => setCohortPeriod(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportCohortData} variant="outline">
                Export CSV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Retention Curve */}
            <Card>
              <CardHeader>
                <CardTitle>Retention Curves by Cohort</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={retentionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period_month" name="Month" />
                    <YAxis unit="%" />
                    <Tooltip formatter={(value, name) => {
                      if (typeof value !== 'number') return [null, null];
                      return [`${value.toFixed(1)}%`, name];
                    }} />
                    {retentionCohorts.map((cohort, index) => (
                      <Line key={cohort} type="monotone" dataKey={cohort} name={cohort} stroke={COLORS[index % COLORS.length]} strokeWidth={2} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cumulative Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Cumulative Revenue per Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period_month" name="Month" />
                    <YAxis unit="£" />
                    <Tooltip formatter={(value, name) => {
                      if (typeof value !== 'number') return [null, null];
                      return [`£${value.toFixed(2)}`, name];
                    }} />
                    {revenueCohorts.map((cohort, index) => (
                      <Line key={cohort} type="monotone" dataKey={cohort} name={cohort} stroke={COLORS[index % COLORS.length]} strokeWidth={2} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Cohort Table */}
          <Card>
            <CardHeader>
              <CardTitle>Cohort Performance Table</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cohort Month</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Customers Remaining</TableHead>
                    <TableHead>Retention Rate</TableHead>
                    <TableHead>Cumulative Revenue</TableHead>
                    <TableHead>Avg Revenue per Customer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.cohortAnalysis.slice(0, 20).map((cohort) => (
                    <TableRow key={`${cohort.cohort_month}-${cohort.period_month}`}>
                      <TableCell>{cohort.cohort_month}</TableCell>
                      <TableCell>Month {cohort.period_month}</TableCell>
                      <TableCell>{cohort.customers_remaining}</TableCell>
                      <TableCell>{cohort.retention_rate.toFixed(1)}%</TableCell>
                      <TableCell>£{cohort.cumulative_revenue.toFixed(2)}</TableCell>
                      <TableCell>£{cohort.avg_revenue_per_customer.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LTV Modeling Tab */}
        <TabsContent value="ltv" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LTV Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>LTV Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.ltvDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ltv_range" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'Customers']} />
                    <Bar dataKey="customer_count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* LTV vs Actual Spend */}
            <Card>
              <CardHeader>
                <CardTitle>Predicted LTV vs Current Spend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={data.ltvPredictions.slice(0, 200)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="current_spend" name="Current Spend" unit="£" />
                    <YAxis type="number" dataKey="predicted_ltv" name="Predicted LTV" unit="£" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name) => [typeof value === 'number' ? `£${value.toFixed(2)}` : value, name]} />
                    <Scatter name="LTV vs Spend" fill="#8b5cf6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top LTV Customers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Customers by Predicted LTV</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Current Spend</TableHead>
                    <TableHead>Predicted LTV</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Potential Uplift</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.ltvPredictions.slice(0, 20).map((prediction) => (
                    <TableRow key={prediction.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {prediction.customer?.first_name} {prediction.customer?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{prediction.customer?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>£{prediction.current_spend?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>£{prediction.predicted_ltv.toFixed(2)}</TableCell>
                      <TableCell>{(prediction.confidence * 100).toFixed(0)}%</TableCell>
                      <TableCell>
                        <span className="text-green-600">
                          £{Math.max(0, prediction.predicted_ltv - (prediction.current_spend || 0)).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCustomerClick(prediction.customer_id)}
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

        {/* Customer Segments Tab */}
        <TabsContent value="segments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Segments Analysis</CardTitle>
              <p className="text-gray-600">Understand your customer base through behavioral segmentation</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {data.customerSegments.map((segment, index) => (
                  <Card key={segment.calculated_segment}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 capitalize">
                        {segment.calculated_segment.replace('_', ' ')} Customers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                        {segment.customers_count}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        £{segment.avg_customer_ltv.toFixed(0)} avg LTV
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Segment</TableHead>
                    <TableHead>Customers</TableHead>
                    <TableHead>Avg Orders</TableHead>
                    <TableHead>Avg LTV</TableHead>
                    <TableHead>Avg Order Value</TableHead>
                    <TableHead>Active (30d)</TableHead>
                    <TableHead>Active (60d)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.customerSegments.map((segment) => (
                    <TableRow key={segment.calculated_segment}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {segment.calculated_segment.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{segment.customers_count}</TableCell>
                      <TableCell>{segment.avg_orders_per_customer.toFixed(1)}</TableCell>
                      <TableCell>£{segment.avg_customer_ltv.toFixed(0)}</TableCell>
                      <TableCell>£{segment.avg_order_value.toFixed(0)}</TableCell>
                      <TableCell>{segment.active_last_30_days}</TableCell>
                      <TableCell>{segment.active_last_60_days}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Clusters Tab */}
        <TabsContent value="clusters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Customer Clusters</CardTitle>
              <p className="text-gray-600">Machine learning discovered customer segments based on behavior patterns</p>
            </CardHeader>
            <CardContent>
              {data.customerClusters.length > 0 ? (
                <div className="space-y-6">
                  {/* Cluster Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {data.customerClusters.map((cluster, index) => (
                      <Card key={cluster.cluster_label}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-gray-600">
                            Cluster {cluster.cluster_label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold" style={{ color: getClusterColor(index) }}>
                            {cluster.customers_count}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            £{cluster.avg_ltv.toFixed(0)} avg LTV
                          </p>
                          <p className="text-xs text-gray-500">
                            {cluster.avg_orders.toFixed(1)} avg orders
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Cluster Details Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cluster</TableHead>
                        <TableHead>Customers</TableHead>
                        <TableHead>Avg LTV</TableHead>
                        <TableHead>Avg Orders</TableHead>
                        <TableHead>Avg Order Value</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.customerClusters.map((cluster, index) => (
                        <TableRow key={cluster.cluster_label}>
                          <TableCell>
                            <Badge style={{ backgroundColor: getClusterColor(index), color: 'white' }}>
                              Cluster {cluster.cluster_label}
                            </Badge>
                          </TableCell>
                          <TableCell>{cluster.customers_count}</TableCell>
                          <TableCell>£{cluster.avg_ltv.toFixed(0)}</TableCell>
                          <TableCell>{cluster.avg_orders.toFixed(1)}</TableCell>
                          <TableCell>£{cluster.avg_order_value.toFixed(0)}</TableCell>
                          <TableCell className="max-w-xs">
                            <span className="text-sm text-gray-600">{cluster.description}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    Customer clustering analysis will be available once we have sufficient data to train the ML model.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  ) : (
    <div className="text-center py-20">
      <p className="text-lg text-gray-700">No customer insights data available for the selected period.</p>
      <p className="text-gray-500">Try selecting a different date range.</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeSection="customer-insights" onSectionChange={handleSectionChange} />
      
      <div className="flex-1 ml-[220px] overflow-auto">
        <Header />
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Insights</h1>
                  <p className="text-gray-600">AI-powered customer analytics, churn prediction, and lifetime value modeling</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGraphExplanationOpen(true)}
                  className="flex items-center gap-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  Explain Graphs
                </Button>
              </div>
              
              {/* Date Filter */}
              <div className="flex items-center space-x-4">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-48">
                    <Calendar className="w-4 h-4 mr-2" />
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
                
                {dateRange === 'custom' && (
                  <>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-40"
                      placeholder="Start Date"
                    />
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-40"
                      placeholder="End Date"
                    />
                  </>
                )}
                
                <Button 
                  onClick={loadData} 
                  variant="outline" 
                  size="sm"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                  ) : (
                    <Calendar className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {pageContent}
        </div>
      </div>

      {/* Customer Details Modal */}
      <Dialog open={customerDetailsOpen} onOpenChange={setCustomerDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <p><strong>Name:</strong> {selectedCustomer.customer.first_name} {selectedCustomer.customer.last_name}</p>
                  <p><strong>Email:</strong> {selectedCustomer.customer.email}</p>
                  <p><strong>Total Spent:</strong> £{selectedCustomer.customer.total_spent?.toFixed(2) || '0.00'}</p>
                  <p><strong>Orders Count:</strong> {selectedCustomer.customer.orders_count || 0}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Risk Metrics</h3>
                  <p><strong>Segment:</strong> {selectedCustomer.customer.customer_segment}</p>
                  <p><strong>Last Order:</strong> {selectedCustomer.customer.last_order_date ? new Date(selectedCustomer.customer.last_order_date).toLocaleDateString() : 'Never'}</p>
                </div>
              </div>

              {/* Order History */}
              <div>
                <h3 className="font-semibold mb-2">Recent Orders</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Channel</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCustomer.orders.slice(0, 5).map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.order_number}</TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>£{order.total_price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.status}</Badge>
                        </TableCell>
                        <TableCell>{order.channel}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Refunds */}
              {selectedCustomer.refunds.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Refund History</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCustomer.refunds.map((refund: any) => (
                        <TableRow key={refund.id}>
                          <TableCell>{new Date(refund.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>£{refund.amount.toFixed(2)}</TableCell>
                          <TableCell>{refund.reason}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{refund.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Graph Explanation Modal */}
      <GraphExplanationModal 
        open={graphExplanationOpen} 
        onOpenChange={setGraphExplanationOpen} 
      />
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