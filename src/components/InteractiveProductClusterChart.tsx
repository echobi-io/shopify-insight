import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Search, Eye, EyeOff, RotateCcw, Package, TrendingUp, TrendingDown } from 'lucide-react'
import { ProductMetrics } from '@/lib/fetchers/getProductPerformanceData'
import { formatCurrency } from '@/lib/utils/settingsUtils'

interface ProductCluster {
  cluster_id: string
  cluster_label: string
  color: string
  center_revenue: number
  center_units: number
  center_margin: number
  description: string
}

interface ProductClusterPoint extends ProductMetrics {
  cluster_id: string
  cluster_label: string
}

interface ProductClusterSummary {
  cluster_id: string
  product_count: number
  avg_revenue: number
  avg_units: number
  avg_margin: number
  total_revenue: number
  cluster_description: string
}

interface ProductClusterAnalysis {
  clusterCenters: ProductCluster[]
  productPoints: ProductClusterPoint[]
  clusterSummaries: ProductClusterSummary[]
}

interface InteractiveProductClusterChartProps {
  products: ProductMetrics[]
  onProductClick?: (productId: string) => void
}

const InteractiveProductClusterChart: React.FC<InteractiveProductClusterChartProps> = ({
  products,
  onProductClick
}) => {
  // Interactive states
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null)
  const [visibleClusters, setVisibleClusters] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProductPoint, setSelectedProductPoint] = useState<any>(null)
  const [productDetailsOpen, setProductDetailsOpen] = useState(false)
  const [clusterAnalysis, setClusterAnalysis] = useState<ProductClusterAnalysis | null>(null)

  // Generate product clusters based on performance metrics
  useEffect(() => {
    if (products.length > 0) {
      const analysis = generateProductClusters(products)
      setClusterAnalysis(analysis)
      
      // Initialize visible clusters
      const allClusterIds = new Set(analysis.clusterCenters.map(c => c.cluster_id))
      setVisibleClusters(allClusterIds)
    }
  }, [products])

  const generateProductClusters = (products: ProductMetrics[]): ProductClusterAnalysis => {
    // Define cluster criteria based on revenue and units sold
    const clusters: ProductCluster[] = [
      {
        cluster_id: 'high_performers',
        cluster_label: 'High Performers',
        color: '#10b981', // Green
        center_revenue: 0,
        center_units: 0,
        center_margin: 0,
        description: 'Products with high revenue and strong sales volume'
      },
      {
        cluster_id: 'volume_sellers',
        cluster_label: 'Volume Sellers',
        color: '#3b82f6', // Blue
        center_revenue: 0,
        center_units: 0,
        center_margin: 0,
        description: 'Products with high unit sales but moderate revenue'
      },
      {
        cluster_id: 'premium_products',
        cluster_label: 'Premium Products',
        color: '#8b5cf6', // Purple
        center_revenue: 0,
        center_units: 0,
        center_margin: 0,
        description: 'High-margin products with lower volume but good revenue'
      },
      {
        cluster_id: 'underperformers',
        cluster_label: 'Underperformers',
        color: '#ef4444', // Red
        center_revenue: 0,
        center_units: 0,
        center_margin: 0,
        description: 'Products with low revenue and sales volume'
      },
      {
        cluster_id: 'emerging_products',
        cluster_label: 'Emerging Products',
        color: '#f59e0b', // Orange
        center_revenue: 0,
        center_units: 0,
        center_margin: 0,
        description: 'Products with growth potential or recent launches'
      }
    ]

    // Calculate percentiles for clustering
    const revenues = products.map(p => p.totalRevenue).sort((a, b) => b - a)
    const units = products.map(p => p.unitsSold).sort((a, b) => b - a)
    const margins = products.map(p => p.profitMargin).sort((a, b) => b - a)
    const growthRates = products.map(p => p.growthRate).sort((a, b) => b - a)

    const revenueP75 = revenues[Math.floor(revenues.length * 0.25)] || 0
    const revenueP50 = revenues[Math.floor(revenues.length * 0.5)] || 0
    const unitsP75 = units[Math.floor(units.length * 0.25)] || 0
    const unitsP50 = units[Math.floor(units.length * 0.5)] || 0
    const marginP75 = margins[Math.floor(margins.length * 0.25)] || 0
    const growthP50 = growthRates[Math.floor(growthRates.length * 0.5)] || 0

    // Classify products into clusters
    const productPoints: ProductClusterPoint[] = products.map(product => {
      let clusterId = 'underperformers'
      let clusterLabel = 'Underperformers'

      // High Performers: High revenue AND high units
      if (product.totalRevenue >= revenueP75 && product.unitsSold >= unitsP75) {
        clusterId = 'high_performers'
        clusterLabel = 'High Performers'
      }
      // Volume Sellers: High units but moderate revenue
      else if (product.unitsSold >= unitsP75 && product.totalRevenue >= revenueP50 && product.totalRevenue < revenueP75) {
        clusterId = 'volume_sellers'
        clusterLabel = 'Volume Sellers'
      }
      // Premium Products: High margin and decent revenue but lower volume
      else if (product.profitMargin >= marginP75 && product.totalRevenue >= revenueP50 && product.unitsSold < unitsP50) {
        clusterId = 'premium_products'
        clusterLabel = 'Premium Products'
      }
      // Emerging Products: Good growth rate or moderate performance
      else if (product.growthRate >= growthP50 || (product.totalRevenue >= revenueP50 && product.unitsSold >= unitsP50)) {
        clusterId = 'emerging_products'
        clusterLabel = 'Emerging Products'
      }

      return {
        ...product,
        cluster_id: clusterId,
        cluster_label: clusterLabel
      }
    })

    // Calculate cluster centers and summaries
    const clusterSummaries: ProductClusterSummary[] = []
    const updatedClusters = clusters.map(cluster => {
      const clusterProducts = productPoints.filter(p => p.cluster_id === cluster.cluster_id)
      
      if (clusterProducts.length > 0) {
        const avgRevenue = clusterProducts.reduce((sum, p) => sum + p.totalRevenue, 0) / clusterProducts.length
        const avgUnits = clusterProducts.reduce((sum, p) => sum + p.unitsSold, 0) / clusterProducts.length
        const avgMargin = clusterProducts.reduce((sum, p) => sum + p.profitMargin, 0) / clusterProducts.length
        const totalRevenue = clusterProducts.reduce((sum, p) => sum + p.totalRevenue, 0)

        clusterSummaries.push({
          cluster_id: cluster.cluster_id,
          product_count: clusterProducts.length,
          avg_revenue: avgRevenue,
          avg_units: avgUnits,
          avg_margin: avgMargin,
          total_revenue: totalRevenue,
          cluster_description: cluster.description
        })

        return {
          ...cluster,
          center_revenue: avgRevenue,
          center_units: avgUnits,
          center_margin: avgMargin
        }
      }

      return cluster
    }).filter(cluster => {
      // Only include clusters that have products
      return productPoints.some(p => p.cluster_id === cluster.cluster_id)
    })

    return {
      clusterCenters: updatedClusters,
      productPoints,
      clusterSummaries
    }
  }

  if (!clusterAnalysis) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-light text-gray-500">Generating product clusters...</p>
        </div>
      </div>
    )
  }

  // Filter product points based on search and visible clusters
  const filteredProductPoints = clusterAnalysis.productPoints.filter(point => {
    const matchesSearch = searchTerm === '' || 
      point.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.sku.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Handle product point click
  const handleProductPointClick = (productPoint: any) => {
    setSelectedProductPoint(productPoint)
    setProductDetailsOpen(true)
  }

  // Reset chart view
  const resetChartView = () => {
    setSelectedCluster(null)
    setSearchTerm('')
    const allClusterIds = new Set(clusterAnalysis.clusterCenters.map(c => c.cluster_id))
    setVisibleClusters(allClusterIds)
  }

  // Get cluster statistics for selected cluster
  const getSelectedClusterStats = () => {
    if (!selectedCluster) return null
    
    const clusterProducts = clusterAnalysis.productPoints.filter(p => p.cluster_id === selectedCluster)
    const clusterSummary = clusterAnalysis.clusterSummaries.find(s => s.cluster_id === selectedCluster)
    const clusterCenter = clusterAnalysis.clusterCenters.find(c => c.cluster_id === selectedCluster)
    
    return {
      products: clusterProducts,
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
              placeholder="Search products..."
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
          Showing {filteredProductPoints.length} of {clusterAnalysis.productPoints.length} products
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
            {center.cluster_label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2">
          <Card className="card-minimal">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-black">
                Interactive Product Cluster Visualization
              </CardTitle>
              <CardDescription className="font-light text-gray-600">
                Products clustered by revenue vs units sold. Click on clusters to highlight, click on points for details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      type="number"
                      dataKey="unitsSold"
                      domain={['dataMin - 10', 'dataMax + 10']}
                      fontSize={12} 
                      stroke="#666"
                      name="Units Sold"
                    />
                    <YAxis 
                      type="number"
                      dataKey="totalRevenue"
                      domain={['dataMin - 100', 'dataMax + 100']}
                      fontSize={12} 
                      stroke="#666"
                      tickFormatter={(value) => formatCurrency(value)}
                      name="Total Revenue"
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-white p-3 border rounded shadow-lg cursor-pointer"
                                 onClick={() => handleProductPointClick(data)}>
                              <p className="font-medium">{data.name}</p>
                              <p className="text-sm text-gray-600">SKU: {data.sku}</p>
                              <p className="text-sm">Revenue: {formatCurrency(data.totalRevenue)}</p>
                              <p className="text-sm">Units Sold: {data.unitsSold.toLocaleString()}</p>
                              <p className="text-sm">Avg Price: {formatCurrency(data.avgPrice)}</p>
                              <p className="text-sm">Margin: {data.profitMargin.toFixed(1)}%</p>
                              <p className="text-sm capitalize">Cluster: {data.cluster_label}</p>
                              <p className="text-xs text-blue-600 mt-1">Click for details</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    
                    {/* Individual Product Points by Cluster */}
                    {clusterAnalysis.clusterCenters
                      .filter(center => visibleClusters.has(center.cluster_id))
                      .map((center) => {
                        const clusterProducts = filteredProductPoints.filter(
                          point => point.cluster_id === center.cluster_id
                        )
                        const isSelected = selectedCluster === center.cluster_id
                        
                        return (
                          <Scatter
                            key={`products-${center.cluster_id}`}
                            data={clusterProducts}
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
                          unitsSold: center.center_units,
                          totalRevenue: center.center_revenue
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
                  {selectedClusterStats.center?.cluster_label}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Products</p>
                    <p className="text-gray-600">{selectedClusterStats.summary?.product_count}</p>
                  </div>
                  <div>
                    <p className="font-medium">Total Revenue</p>
                    <p className="text-gray-600">{formatCurrency(selectedClusterStats.summary?.total_revenue || 0)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Avg Revenue</p>
                    <p className="text-gray-600">{formatCurrency(selectedClusterStats.summary?.avg_revenue || 0)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Avg Units</p>
                    <p className="text-gray-600">{selectedClusterStats.summary?.avg_units.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Avg Margin</p>
                    <p className="text-gray-600">{selectedClusterStats.summary?.avg_margin.toFixed(1)}%</p>
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
                <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
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
                <span className="text-gray-600">Total Products:</span>
                <span className="font-medium">{clusterAnalysis.productPoints.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Visible Products:</span>
                <span className="font-medium">{filteredProductPoints.length}</span>
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

      {/* Product List for Selected Cluster */}
      {selectedCluster && selectedClusterStats && (
        <Card className="card-minimal">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-black">
              Products in {selectedClusterStats.center?.cluster_label}
            </CardTitle>
            <CardDescription className="font-light text-gray-600">
              {selectedClusterStats.products.length} products in this cluster
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Units Sold</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead className="text-right">Growth</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedClusterStats.products.slice(0, 10).map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-black">{product.name}</div>
                          <div className="text-sm font-light text-gray-500">
                            SKU: {product.sku} • {product.category}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-light">
                        {formatCurrency(product.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right font-light">
                        {product.unitsSold.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-light">
                        {formatCurrency(product.avgPrice)}
                      </TableCell>
                      <TableCell className="text-right font-light">
                        <span className={`${
                          product.profitMargin >= 20 ? 'text-green-600' :
                          product.profitMargin >= 10 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {product.profitMargin.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-light">
                        <span className={`flex items-center justify-end ${
                          product.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {product.growthRate >= 0 ? (
                            <TrendingUp className="w-4 h-4 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 mr-1" />
                          )}
                          {Math.abs(product.growthRate).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onProductClick?.(product.id)}
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
            {selectedClusterStats.products.length > 10 && (
              <div className="text-center mt-4">
                <p className="text-sm text-gray-600 font-light">
                  Showing 10 of {selectedClusterStats.products.length} products
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Product Details Modal */}
      <Dialog open={productDetailsOpen} onOpenChange={setProductDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-medium">Product Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected product
            </DialogDescription>
          </DialogHeader>
          {selectedProductPoint && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Product Information</h3>
                  <p className="font-light"><strong>Name:</strong> {selectedProductPoint.name}</p>
                  <p className="font-light"><strong>SKU:</strong> {selectedProductPoint.sku}</p>
                  <p className="font-light"><strong>Category:</strong> {selectedProductPoint.category}</p>
                  <p className="font-light"><strong>Revenue:</strong> {formatCurrency(selectedProductPoint.totalRevenue)}</p>
                  <p className="font-light"><strong>Units Sold:</strong> {selectedProductPoint.unitsSold.toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Performance Metrics</h3>
                  <p className="font-light"><strong>Avg Price:</strong> {formatCurrency(selectedProductPoint.avgPrice)}</p>
                  <p className="font-light"><strong>Profit Margin:</strong> {selectedProductPoint.profitMargin.toFixed(1)}%</p>
                  <p className="font-light"><strong>Growth Rate:</strong> {selectedProductPoint.growthRate.toFixed(1)}%</p>
                  <p className="font-light"><strong>Performance Score:</strong> {selectedProductPoint.performanceScore.toFixed(0)}</p>
                  <div className="mt-2">
                    <Badge 
                      variant="outline"
                      style={{ 
                        borderColor: clusterAnalysis.clusterCenters.find(c => c.cluster_id === selectedProductPoint.cluster_id)?.color,
                        color: clusterAnalysis.clusterCenters.find(c => c.cluster_id === selectedProductPoint.cluster_id)?.color
                      }}
                    >
                      {selectedProductPoint.cluster_label}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => onProductClick?.(selectedProductPoint.id)}
                  className="font-light"
                >
                  View Full Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setProductDetailsOpen(false)}
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

export default InteractiveProductClusterChart