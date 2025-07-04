import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Search, Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw, Users } from 'lucide-react'
import { ClusterAnalysis } from '@/lib/fetchers/getCustomerInsightsData'
import { formatCurrency } from '@/lib/utils/settingsUtils'

interface InteractiveClusterChartProps {
  clusterAnalysis: ClusterAnalysis
  onCustomerClick?: (customerId: string) => void
}

const InteractiveClusterChart: React.FC<InteractiveClusterChartProps> = ({
  clusterAnalysis,
  onCustomerClick
}) => {
  // Interactive states
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null)
  const [visibleClusters, setVisibleClusters] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomerPoint, setSelectedCustomerPoint] = useState<any>(null)
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false)
  const [chartZoom, setChartZoom] = useState({ scale: 1, offsetX: 0, offsetY: 0 })

  // Initialize visible clusters
  useEffect(() => {
    if (clusterAnalysis.clusterCenters.length > 0) {
      const allClusterIds = new Set(clusterAnalysis.clusterCenters.map(c => c.cluster_id))
      setVisibleClusters(allClusterIds)
    }
  }, [clusterAnalysis])

  // Filter customer points based on search and visible clusters
  const filteredCustomerPoints = clusterAnalysis.customerPoints.filter(point => {
    const matchesSearch = searchTerm === '' || 
      point.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
    const isClusterVisible = visibleClusters.has(point.cluster_id)
    return matchesSearch && isClusterVisible
  })

  // Handle cluster toggle
  const toggleClusterVisibility = (clusterId: string) => {
    const newVisibleClusters = new Set(visibleClusters)
    if (newVisibleClusters.has(clusterId)) {
      newVisibleClusters.delete(clusterId)
    } else {
      newVisibleClusters.add(clusterId)
    }
    setVisibleClusters(newVisibleClusters)
  }

  // Handle cluster selection
  const handleClusterSelect = (clusterId: string) => {
    setSelectedCluster(selectedCluster === clusterId ? null : clusterId)
  }

  // Handle customer point click
  const handleCustomerPointClick = (customerPoint: any) => {
    setSelectedCustomerPoint(customerPoint)
    setCustomerDetailsOpen(true)
  }

  // Reset chart view
  const resetChartView = () => {
    setChartZoom({ scale: 1, offsetX: 0, offsetY: 0 })
    setSelectedCluster(null)
    setSearchTerm('')
    const allClusterIds = new Set(clusterAnalysis.clusterCenters.map(c => c.cluster_id))
    setVisibleClusters(allClusterIds)
  }

  // Get cluster statistics for selected cluster
  const getSelectedClusterStats = () => {
    if (!selectedCluster) return null
    
    const clusterPoints = clusterAnalysis.customerPoints.filter(p => p.cluster_id === selectedCluster)
    const clusterSummary = clusterAnalysis.clusterSummaries.find(s => s.cluster_id === selectedCluster)
    const clusterCenter = clusterAnalysis.clusterCenters.find(c => c.cluster_id === selectedCluster)
    
    return {
      points: clusterPoints,
      summary: clusterSummary,
      center: clusterCenter
    }
  }

  const selectedClusterStats = getSelectedClusterStats()

  return (
    <div className="space-y-6">
      {/* Interactive Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetChartView}
            className="font-light"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset View
          </Button>
        </div>

        <div className="text-sm text-gray-600 font-light">
          Showing {filteredCustomerPoints.length} of {clusterAnalysis.customerPoints.length} customers
        </div>
      </div>

      {/* Cluster Toggle Controls */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-700 mr-2">Toggle Clusters:</span>
        {clusterAnalysis.clusterCenters.map((center) => (
          <Button
            key={center.cluster_id}
            variant={visibleClusters.has(center.cluster_id) ? "default" : "outline"}
            size="sm"
            onClick={() => toggleClusterVisibility(center.cluster_id)}
            className="font-light"
            style={{
              backgroundColor: visibleClusters.has(center.cluster_id) ? center.color : 'transparent',
              borderColor: center.color,
              color: visibleClusters.has(center.cluster_id) ? 'white' : center.color
            }}
          >
            {visibleClusters.has(center.cluster_id) ? (
              <Eye className="h-3 w-3 mr-1" />
            ) : (
              <EyeOff className="h-3 w-3 mr-1" />
            )}
            {center.cluster_label.replace('_', ' ')}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2">
          <Card className="card-minimal">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-black">
                Interactive Customer Cluster Visualization
              </CardTitle>
              <CardDescription className="font-light text-gray-600">
                Click on clusters to highlight, click on points for details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      type="number"
                      dataKey="avg_order_value"
                      domain={['dataMin - 50', 'dataMax + 50']}
                      fontSize={12} 
                      stroke="#666"
                      tickFormatter={(value) => formatCurrency(value)}
                      name="Avg Order Value"
                    />
                    <YAxis 
                      type="number"
                      dataKey="total_spent"
                      domain={['dataMin - 100', 'dataMax + 100']}
                      fontSize={12} 
                      stroke="#666"
                      tickFormatter={(value) => formatCurrency(value)}
                      name="Total Spent"
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-white p-3 border rounded shadow-lg cursor-pointer"
                                 onClick={() => handleCustomerPointClick(data)}>
                              <p className="font-medium">{data.customer_name || 'Unknown Customer'}</p>
                              <p className="text-sm text-gray-600">{data.customer_email}</p>
                              <p className="text-sm">Total Spent: {formatCurrency(data.total_spent)}</p>
                              <p className="text-sm">Avg Order Value: {formatCurrency(data.avg_order_value)}</p>
                              <p className="text-sm">Orders: {data.orders_count}</p>
                              <p className="text-sm capitalize">Cluster: {data.cluster_label.replace('_', ' ')}</p>
                              <p className="text-xs text-blue-600 mt-1">Click for details</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    
                    {/* Individual Customer Points by Cluster */}
                    {clusterAnalysis.clusterCenters
                      .filter(center => visibleClusters.has(center.cluster_id))
                      .map((center) => {
                        const clusterCustomers = filteredCustomerPoints.filter(
                          point => point.cluster_id === center.cluster_id
                        )
                        const isSelected = selectedCluster === center.cluster_id
                        
                        return (
                          <Scatter
                            key={`customers-${center.cluster_id}`}
                            data={clusterCustomers}
                            fill={center.color}
                            fillOpacity={isSelected ? 0.9 : 0.6}
                            stroke={center.color}
                            strokeWidth={isSelected ? 2 : 1}
                            r={isSelected ? 6 : 4}
                            onClick={() => handleClusterSelect(center.cluster_id)}
                            style={{ cursor: 'pointer' }}
                          />
                        )
                      })}
                    
                    {/* Cluster Centers */}
                    <Scatter
                      data={clusterAnalysis.clusterCenters
                        .filter(center => visibleClusters.has(center.cluster_id))
                        .map(center => ({
                          ...center,
                          avg_order_value: center.center_avg_order_value,
                          total_spent: center.center_total_spent
                        }))}
                      fill="none"
                      stroke="#000"
                      strokeWidth={3}
                      shape="cross"
                      r={10}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cluster Details Panel */}
        <div className="space-y-4">
          {selectedCluster && selectedClusterStats ? (
            <Card className="card-minimal">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-black">
                  Cluster Details
                </CardTitle>
                <CardDescription className="font-light text-gray-600">
                  {selectedClusterStats.center?.cluster_label.replace('_', ' ')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Customers</p>
                    <p className="text-gray-600">{selectedClusterStats.summary?.customer_count}</p>
                  </div>
                  <div>
                    <p className="font-medium">Avg LTV</p>
                    <p className="text-gray-600">{formatCurrency(selectedClusterStats.summary?.avg_ltv || 0)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Avg AOV</p>
                    <p className="text-gray-600">{formatCurrency(selectedClusterStats.summary?.avg_order_value || 0)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Avg Orders</p>
                    <p className="text-gray-600">{selectedClusterStats.summary?.orders_count.toFixed(1)}</p>
                  </div>
                </div>
                
                <div>
                  <p className="font-medium text-sm mb-2">Description</p>
                  <p className="text-sm text-gray-600 font-light">
                    {selectedClusterStats.summary?.cluster_description}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCluster(null)}
                  className="w-full font-light"
                >
                  Clear Selection
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="card-minimal">
              <CardContent className="text-center py-8">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 font-light">
                  Click on a cluster to see details
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card className="card-minimal">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-black">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Customers:</span>
                <span className="font-medium">{clusterAnalysis.customerPoints.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Visible Customers:</span>
                <span className="font-medium">{filteredCustomerPoints.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Clusters:</span>
                <span className="font-medium">{visibleClusters.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Clusters:</span>
                <span className="font-medium">{clusterAnalysis.clusterCenters.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Customer List for Selected Cluster */}
      {selectedCluster && selectedClusterStats && (
        <Card className="card-minimal">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-black">
              Customers in {selectedClusterStats.center?.cluster_label.replace('_', ' ')}
            </CardTitle>
            <CardDescription className="font-light text-gray-600">
              {selectedClusterStats.points.length} customers in this cluster
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total Spent</TableHead>
                    <TableHead className="text-right">Avg Order Value</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedClusterStats.points.slice(0, 10).map((customer) => (
                    <TableRow key={customer.customer_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-black">{customer.customer_name}</div>
                          <div className="text-sm font-light text-gray-500">{customer.customer_email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-light">
                        {formatCurrency(customer.total_spent)}
                      </TableCell>
                      <TableCell className="text-right font-light">
                        {formatCurrency(customer.avg_order_value)}
                      </TableCell>
                      <TableCell className="text-right font-light">
                        {customer.orders_count}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCustomerClick?.(customer.customer_id)}
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
            {selectedClusterStats.points.length > 10 && (
              <div className="text-center mt-4">
                <p className="text-sm text-gray-600 font-light">
                  Showing 10 of {selectedClusterStats.points.length} customers
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Customer Details Modal */}
      <Dialog open={customerDetailsOpen} onOpenChange={setCustomerDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-medium">Customer Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected customer
            </DialogDescription>
          </DialogHeader>
          {selectedCustomerPoint && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Customer Information</h3>
                  <p className="font-light"><strong>Name:</strong> {selectedCustomerPoint.customer_name}</p>
                  <p className="font-light"><strong>Email:</strong> {selectedCustomerPoint.customer_email}</p>
                  <p className="font-light"><strong>Total Spent:</strong> {formatCurrency(selectedCustomerPoint.total_spent)}</p>
                  <p className="font-light"><strong>Orders:</strong> {selectedCustomerPoint.orders_count}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Cluster Information</h3>
                  <p className="font-light"><strong>Cluster:</strong> {selectedCustomerPoint.cluster_label.replace('_', ' ')}</p>
                  <p className="font-light"><strong>Avg Order Value:</strong> {formatCurrency(selectedCustomerPoint.avg_order_value)}</p>
                  <div className="mt-2">
                    <Badge 
                      variant="outline"
                      style={{ 
                        borderColor: clusterAnalysis.clusterCenters.find(c => c.cluster_id === selectedCustomerPoint.cluster_id)?.color,
                        color: clusterAnalysis.clusterCenters.find(c => c.cluster_id === selectedCustomerPoint.cluster_id)?.color
                      }}
                    >
                      {selectedCustomerPoint.cluster_label.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => onCustomerClick?.(selectedCustomerPoint.customer_id)}
                  className="font-light"
                >
                  View Full Profile
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCustomerDetailsOpen(false)}
                  className="font-light"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default InteractiveClusterChart