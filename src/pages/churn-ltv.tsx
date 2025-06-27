import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { getChurnLtvData, getChurnCustomerDetails, ChurnLtvData, ChurnPrediction } from '@/lib/fetchers/getChurnLtvData'
import { exportToCSV } from '@/lib/utils/exportUtils'
import Sidebar from '@/components/Sidebar'

const ChurnLtvPage: React.FC = () => {
  const [data, setData] = useState<ChurnLtvData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getChurnLtvData()
      setData(result)
    } catch (err) {
      console.error('Error loading churn & LTV data:', err)
      setError('Failed to load churn & LTV data')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerClick = async (customerId: string) => {
    try {
      const details = await getChurnCustomerDetails(customerId)
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

  const getRiskBadgeColor = (band: string) => {
    switch (band) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6']

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar activeSection="churn-ltv" />
        <div className="flex-1 ml-[220px] p-8">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading churn & LTV analytics...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar activeSection="churn-ltv" />
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
        <Sidebar activeSection="churn-ltv" />
        <div className="flex-1 ml-[220px] p-8">
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600">We'll show predictions once you have 60 days of transaction data.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeSection="churn-ltv" />
      
      <div className="flex-1 ml-[220px] overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Churn & LTV Analytics</h1>
            <p className="text-gray-600">AI-powered customer retention and lifetime value insights</p>
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
              transition={{ delay: 0.2 }}
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
                  <div className="text-2xl font-bold text-blue-600">£{data.kpis.averageLtv.toFixed(0)}</div>
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
                  <CardTitle className="text-sm font-medium text-gray-600">Lifetime Value Potential</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">£{data.kpis.lifetimeValuePotential.toFixed(0)}</div>
                  <p className="text-xs text-gray-500 mt-1">Total predicted LTV</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue at Risk Trend */}
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
          </div>

          {/* Customer Churn Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Customer Churn Analysis</CardTitle>
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
                  {filteredChurnData.map((prediction) => (
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

export default ChurnLtvPage