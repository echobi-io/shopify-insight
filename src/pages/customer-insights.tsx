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
import { useRouter } from 'next/router'

const CustomerInsightsPage: React.FC = () => {
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

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getCustomerInsightsData()
      setData(result)
    } catch (err) {
      console.error('Error loading customer insights data:', err)
      setError('Failed to load customer insights data')
    } finally {
      setLoading(false)
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
      <div className="flex h-screen">
        <Sidebar activeSection="customer-insights" onSectionChange={handleSectionChange} />
        <div className="flex-1 ml-[220px] p-8">
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
      <div className="flex h-screen">
        <Sidebar activeSection="customer-insights" onSectionChange={handleSectionChange} />
        <div className="flex-1 ml-[220px] p-8">
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
      <div className="flex h-screen">
        <Sidebar activeSection="customer-insights" onSectionChange={handleSectionChange} />
        <div className="flex-1 ml-[220px] p-8">
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600">Insufficient data to generate customer insights yet. We need at least 60 days of transaction data.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeSection="customer-insights" onSectionChange={handleSectionChange} />
      
      <div className="flex-1 ml-[220px] overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Insights</h1>
            <p className="text-gray-600">AI-powered customer analytics, churn prediction, and lifetime value modeling</p>
          </div>

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
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="customers_count"
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
                        <Tooltip formatter={(value) => [`£${value}`, 'Revenue at Risk']} />
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
                      <LineChart data={data.cohortAnalysis}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period_month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value}%`, 'Retention Rate']} />
                        <Line type="monotone" dataKey="retention_rate" stroke="#3b82f6" strokeWidth={2} />
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
                      <LineChart data={data.cohortAnalysis}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period_month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`£${value}`, 'Avg Revenue per Customer']} />
                        <Line type="monotone" dataKey="avg_revenue_per_customer" stroke="#10b981" strokeWidth={2} />
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
                      {data.cohortAnalysis.slice(0, 20).map((cohort, index) => (
                        <TableRow key={index}>
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
                      <ScatterChart data={data.ltvPredictions.slice(0, 100)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="current_spend" name="Current Spend" />
                        <YAxis dataKey="predicted_ltv" name="Predicted LTV" />
                        <Tooltip formatter={(value, name) => [`£${value}`, name]} />
                        <Scatter dataKey="predicted_ltv" fill="#8b5cf6" />
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
    </div>
  )
}

export default CustomerInsightsPage