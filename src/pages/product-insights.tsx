import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Star, RefreshCw, AlertCircle, Search, Filter } from 'lucide-react'
import { getProductPerformanceData, type ProductPerformanceData, type ProductMetrics, type ProductTrend } from '@/lib/fetchers/getProductPerformanceData'
import { getReturnedProductsData, type ReturnedProductsData } from '@/lib/fetchers/getReturnedProductsData'
import { getDateRangeFromTimeframe, formatDateForSQL } from '@/lib/utils/dateUtils'
import { formatCurrency, getInitialTimeframe } from '@/lib/utils/settingsUtils'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import ProtectedRoute from '@/components/ProtectedRoute'
import DateRangeSelector from '@/components/DateRangeSelector'
import EnhancedKPICard from '@/components/EnhancedKPICard'
import HelpSection from '@/components/HelpSection'
import ReturnedProductsSection from '@/components/ReturnedProductsSection'
import InteractiveProductClusterChart from '@/components/InteractiveProductClusterChart'

const HARDCODED_MERCHANT_ID = '11111111-1111-1111-1111-111111111111'

const ProductInsightsPage: React.FC = () => {
  const [data, setData] = useState<ProductPerformanceData | null>(null)
  const [returnedProductsData, setReturnedProductsData] = useState<ReturnedProductsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [timeframe, setTimeframe] = useState(getInitialTimeframe())
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'revenue' | 'units' | 'margin' | 'growth'>('revenue')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [activeTab, setActiveTab] = useState('overview')

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

      console.log('🔄 Loading product insights data with filters:', filters)
      
      // Load both product performance and returned products data in parallel
      const [performanceResult, returnsResult] = await Promise.all([
        getProductPerformanceData(HARDCODED_MERCHANT_ID, filters),
        getReturnedProductsData(HARDCODED_MERCHANT_ID, filters)
      ])
      
      setData(performanceResult)
      setReturnedProductsData(returnsResult)
    } catch (err) {
      console.error('Error loading product insights data:', err)
      setError('Failed to load product insights data')
    } finally {
      setLoading(false)
    }
  }

  const getProductHelpItems = () => [
    {
      title: "Product Performance Metrics",
      content: "Track key metrics including revenue, units sold, profit margins, and growth rates for each product in your catalog."
    },
    {
      title: "Category Analysis",
      content: "Compare performance across different product categories to identify your strongest and weakest performing segments."
    },
    {
      title: "Trend Analysis",
      content: "Monitor product performance trends over time to identify seasonal patterns and growth opportunities."
    },
    {
      title: "Return Analysis",
      content: "Analyze product returns to identify quality issues, customer satisfaction problems, and opportunities for improvement. Drill down into specific return reasons for each product."
    },
    {
      title: "Inventory Insights",
      content: "Get insights into stock levels, turnover rates, and identify products that may need restocking or discontinuation."
    }
  ]

  // Filter and sort products
  const filteredProducts = data?.products.filter(product => {
    const matchesSearch = searchTerm === '' || 
      (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    return matchesSearch && matchesCategory
  }).sort((a, b) => {
    let aValue: number, bValue: number
    switch (sortBy) {
      case 'revenue':
        aValue = a.totalRevenue || 0
        bValue = b.totalRevenue || 0
        break
      case 'units':
        aValue = a.unitsSold || 0
        bValue = b.unitsSold || 0
        break
      case 'margin':
        aValue = a.profitMargin || 0
        bValue = b.profitMargin || 0
        break
      case 'growth':
        aValue = a.growthRate || 0
        bValue = b.growthRate || 0
        break
      default:
        aValue = a.totalRevenue || 0
        bValue = b.totalRevenue || 0
    }
    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue
  }) || []

  const categories = [...new Set(data?.products.map(p => p.category).filter(Boolean))] || []

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-[240px]">
          <Header />
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-black mx-auto mb-4" />
              <p className="text-gray-600 font-light">Loading product insights...</p>
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
            <p className="text-gray-600 font-light">No product data available for the selected period.</p>
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
                <h1 className="text-3xl font-light text-black mb-2">Product Insights</h1>
                <p className="text-gray-600 font-light">Product performance analytics and inventory insights</p>
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
              title="Total Products"
              value={data.summary.totalProducts}
              previousValue={data.summary.previousTotalProducts}
              icon={<Package className="w-5 h-5" />}
              isMonetary={false}
            />
            <EnhancedKPICard
              title="Total Revenue"
              value={data.summary.totalRevenue}
              previousValue={data.summary.previousTotalRevenue}
              icon={<DollarSign className="w-5 h-5" />}
              isMonetary={true}
            />
            <EnhancedKPICard
              title="Units Sold"
              value={data.summary.totalUnitsSold}
              previousValue={data.summary.previousTotalUnitsSold}
              icon={<ShoppingCart className="w-5 h-5" />}
              isMonetary={false}
            />
            <EnhancedKPICard
              title="Avg Profit Margin"
              value={data.summary.avgProfitMargin}
              previousValue={data.summary.previousAvgProfitMargin}
              icon={<TrendingUp className="w-5 h-5" />}
              isMonetary={false}
            />
          </div>

          {/* Tabs for different views */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="clusters">Product Clusters</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Category Performance */}
                <Card className="card-minimal">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-black">Revenue by Category</CardTitle>
                    <CardDescription className="font-light text-gray-600">
                      Performance breakdown by product category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.categoryPerformance.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={data.categoryPerformance}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ category, percentage }) => `${category}: ${percentage}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="revenue"
                            >
                              {data.categoryPerformance.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => [formatCurrency(value), 'Revenue']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center">
                        <div className="text-center">
                          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm font-light text-gray-500">No category data available</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Products Trend */}
                <Card className="card-minimal">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-black">Top Products Performance</CardTitle>
                    <CardDescription className="font-light text-gray-600">
                      Revenue trend for top performing products
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.topProductsTrend.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.topProductsTrend}>
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
                              formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="revenue" 
                              stroke="#3b82f6" 
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
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
              </div>

              {/* Returned Products Section */}
              {returnedProductsData && (
                <div>
                  <ReturnedProductsSection
                    products={returnedProductsData.products}
                    totalReturns={returnedProductsData.totalReturns}
                    totalReturnValue={returnedProductsData.totalReturnValue}
                    avgReturnRate={returnedProductsData.avgReturnRate}
                  />
                </div>
              )}

              {/* Product Table */}
              <Card className="card-minimal">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-medium text-black">Product Performance</CardTitle>
                      <CardDescription className="font-light text-gray-600">
                        Detailed performance metrics for all products
                      </CardDescription>
                    </div>
                    
                    {/* Filters */}
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search products..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="revenue">Revenue</SelectItem>
                          <SelectItem value="units">Units</SelectItem>
                          <SelectItem value="margin">Margin</SelectItem>
                          <SelectItem value="growth">Growth</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                        className="font-light"
                      >
                        {sortOrder === 'desc' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredProducts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Revenue</TableHead>
                            <TableHead className="text-right">Units Sold</TableHead>
                            <TableHead className="text-right">Avg Price</TableHead>
                            <TableHead className="text-right">Profit Margin</TableHead>
                            <TableHead className="text-right">Growth Rate</TableHead>
                            <TableHead>Performance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProducts.slice(0, 50).map((product) => (
                            <TableRow key={product.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium text-black">{product.name}</div>
                                  <div className="text-sm font-light text-gray-500">SKU: {product.sku}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-light">
                                  {product.category || 'Uncategorized'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-light">
                                {formatCurrency(product.totalRevenue || 0)}
                              </TableCell>
                              <TableCell className="text-right font-light">
                                {(product.unitsSold || 0).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right font-light">
                                {formatCurrency(product.avgPrice || 0)}
                              </TableCell>
                              <TableCell className="text-right font-light">
                                <span className={`${
                                  (product.profitMargin || 0) >= 20 ? 'text-green-600' :
                                  (product.profitMargin || 0) >= 10 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {(product.profitMargin || 0).toFixed(1)}%
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-light">
                                <span className={`flex items-center justify-end ${
                                  (product.growthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {(product.growthRate || 0) >= 0 ? (
                                    <TrendingUp className="w-4 h-4 mr-1" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4 mr-1" />
                                  )}
                                  {Math.abs(product.growthRate || 0).toFixed(1)}%
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < Math.floor((product.performanceScore || 0) / 20)
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                  <span className="ml-2 text-sm font-light text-gray-600">
                                    {(product.performanceScore || 0).toFixed(0)}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-light">No products found matching your criteria</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clusters" className="space-y-8">
              {data.products.length > 0 ? (
                <InteractiveProductClusterChart
                  products={data.products}
                  onProductClick={(productId) => {
                    console.log('Product clicked:', productId)
                    // You can add navigation or modal logic here
                  }}
                />
              ) : (
                <Card className="card-minimal">
                  <CardContent className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-light">No product data available for clustering</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Help Section */}
          <HelpSection 
            title="Product Insights Help & Information"
            items={getProductHelpItems()}
            defaultOpen={false}
          />
        </div>
      </div>
    </div>
  )
}

export default function ProductInsights() {
  return (
    <ProtectedRoute>
      <ProductInsightsPage />
    </ProtectedRoute>
  )
}