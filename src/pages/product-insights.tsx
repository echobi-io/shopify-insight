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
import { getProductPerformanceDataSimple, type ProductPerformanceData, type ProductMetrics, type ProductTrend } from '@/lib/fetchers/getProductPerformanceDataSimple'
import { getReturnedProductsData, type ReturnedProductsData } from '@/lib/fetchers/getReturnedProductsData'
import { getDateRangeFromTimeframe, formatDateForSQL } from '@/lib/utils/dateUtils'
import { formatCurrency, getInitialTimeframe } from '@/lib/utils/settingsUtils'
import { useDataFetcher } from '@/hooks/useDataFetcher'
import { 
  LoadingOverlay, 
  KPICardSkeleton, 
  ChartSkeleton, 
  ErrorState, 
  EmptyState,
  DataStateWrapper,
  ConnectionStatus
} from '@/components/ui/loading-states'
import AppLayout from '@/components/Layout/AppLayout'
import PageHeader from '@/components/Layout/PageHeader'
import PageFilters from '@/components/Layout/PageFilters'
import ProtectedRoute from '@/components/ProtectedRoute'
import EnhancedKPICard from '@/components/EnhancedKPICard'
import HelpSection from '@/components/HelpSection'
import ReturnedProductsSection from '@/components/ReturnedProductsSection'
import InteractiveProductClusterChart from '@/components/InteractiveProductClusterChart'
import { useAuth } from '@/contexts/AuthContext'



const ProductInsightsPage: React.FC = () => {
  const { merchantId } = useAuth()
  
  // Filter states
  const [timeframe, setTimeframe] = useState(getInitialTimeframe())
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'revenue' | 'units' | 'margin' | 'growth'>('revenue')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [activeTab, setActiveTab] = useState('overview')

  // Calculate date filters
  const dateRange = getDateRangeFromTimeframe(timeframe, customStartDate, customEndDate)
  const filters = {
    startDate: formatDateForSQL(dateRange.startDate),
    endDate: formatDateForSQL(dateRange.endDate)
  }

  // Optimized data fetching with proper error handling and loading states
  const productDataFetcher = useDataFetcher(
    () => {
      if (!merchantId) {
        return Promise.resolve({
          data: null,
          error: new Error('No merchant ID available'),
          success: false,
          loading: false
        })
      }
      return getProductPerformanceDataSimple(merchantId, filters, {
        cacheKey: `product_performance_simple_${merchantId}_${filters.startDate}_${filters.endDate}`,
        timeout: 15000, // 15 seconds for simple data
        retries: 2
      }).then(result => ({ data: result, error: null, success: true, loading: false }))
    },
    {
      enabled: !!merchantId,
      refetchOnWindowFocus: false,
      onError: (error) => console.error('❌ Error loading product performance data:', error)
    }
  )

  const returnedProductsDataFetcher = useDataFetcher(
    () => {
      if (!merchantId) {
        return Promise.resolve({
          data: null,
          error: new Error('No merchant ID available'),
          success: false,
          loading: false
        })
      }
      return getReturnedProductsData(merchantId, filters).then(data => ({ data, error: null, success: true, loading: false })).catch(error => ({ data: null, error, success: false, loading: false }))
    },
    {
      enabled: !!merchantId,
      refetchOnWindowFocus: false,
      onError: (error) => console.error('❌ Error loading returned products data:', error)
    }
  )

  // Extract data with fallbacks
  const data = productDataFetcher.data
  const returnedProductsData = returnedProductsDataFetcher.data
  const loading = productDataFetcher.loading || returnedProductsDataFetcher.loading

  // Refetch data when filters change
  useEffect(() => {
    productDataFetcher.refetch()
    returnedProductsDataFetcher.refetch()
  }, [timeframe, customStartDate, customEndDate])

  const handleRefresh = () => {
    productDataFetcher.refetch()
    returnedProductsDataFetcher.refetch()
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
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    return matchesSearch && matchesCategory
  }).sort((a, b) => {
    let aValue: number, bValue: number
    switch (sortBy) {
      case 'revenue':
        aValue = a.totalRevenue
        bValue = b.totalRevenue
        break
      case 'units':
        aValue = a.unitsSold
        bValue = b.unitsSold
        break
      case 'margin':
        aValue = a.profitMargin
        bValue = b.profitMargin
        break
      case 'growth':
        aValue = a.growthRate
        bValue = b.growthRate
        break
      default:
        aValue = a.totalRevenue
        bValue = b.totalRevenue
    }
    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue
  }) || []

  const categories = [...new Set(data?.products.map(p => p.category).filter(Boolean))] || []

  return (
    <AppLayout loading={loading} loadingMessage="Loading product insights...">
      <ConnectionStatus />
      
      <PageHeader
        title="Product Insights"
        description="Product performance analytics and inventory insights"
        onRefresh={handleRefresh}
        loading={loading}
        actions={
          <PageFilters
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomStartDateChange={setCustomStartDate}
            onCustomEndDateChange={setCustomEndDate}
            showGranularity={false}
          />
        }
      />

      {/* KPI Cards with Loading States */}
      <DataStateWrapper
        data={data}
        loading={productDataFetcher.loading}
        error={productDataFetcher.error}
        onRetry={productDataFetcher.refetch}
        loadingComponent={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <KPICardSkeleton key={i} />
            ))}
          </div>
        }
        errorComponent={
          <ErrorState 
            error={productDataFetcher.error!} 
            onRetry={productDataFetcher.refetch}
            title="Failed to load product data"
            description="Unable to fetch product performance information"
            showDetails={true}
          />
        }
        emptyComponent={
          <EmptyState 
            title="No product data available"
            description="No product data found for the selected period"
            icon={<Package className="h-12 w-12 text-muted-foreground" />}
          />
        }
        className="mb-8"
      >
        {(data) => (
          <>
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
                                  {product.category}
                                </Badge>
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
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < Math.floor(product.performanceScore / 20)
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                  <span className="ml-2 text-sm font-light text-gray-600">
                                    {product.performanceScore.toFixed(0)}
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
          </>
        )}
      </DataStateWrapper>
    </AppLayout>
  )
}

export default ProductInsightsPage