import React, { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  AreaChart, 
  Area, 
  ComposedChart,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Line,
  LineChart,
  Bar
} from 'recharts'
import { 
  TrendingUp, 
  ShoppingCart, 
  Target,
  AlertTriangle,
  Package,
  User,
  ArrowRight,
  Calendar,
  Mail,
  ChevronDown,
  ChevronUp,
  Phone,
  Clock,
  Star,
  Shield,
  X,
  DollarSign,
  Users
} from 'lucide-react'
import { 
  getSalesAnalysisData,
  SalesAnalysisKPIs,
  RevenueTimeSeriesData,
  ChannelRevenueData,
  TopProduct,
  TopCustomer,
  ProductDrillDown,
  CustomerDrillDown,
  getRevenueTimeSeries,
  getProductDrillDown,
  getCustomerDrillDown
} from '@/lib/fetchers/getSalesAnalysisData'
import { getEnhancedCustomerData, EnhancedCustomerData } from '@/lib/fetchers/getEnhancedCustomerData'
import { getKPIs, getPreviousYearKPIs, type KPIData, type FilterState } from '@/lib/fetchers/getKpis'
import { getDateRangeFromTimeframe, formatDateForSQL } from '@/lib/utils/dateUtils'
import Layout from '@/components/Layout/AppLayout'
import PageHeader from '@/components/Layout/PageHeader'
import PageFilters from '@/components/Layout/PageFilters'
import KPIGrid from '@/components/Layout/KPIGrid'
import ChartCard from '@/components/Layout/ChartCard'
import HelpSection, { getSalesAnalysisHelpItems } from '@/components/HelpSection'
import DataDebugPanel from '@/components/DataDebugPanel'
import { usePageState } from '@/hooks/usePageState'

const HARDCODED_MERCHANT_ID = '11111111-1111-1111-1111-111111111111'

const SalesAnalysisPage: React.FC = () => {
  // Data states
  const [kpis, setKpis] = useState<SalesAnalysisKPIs | null>(null)
  const [enhancedKpis, setEnhancedKpis] = useState<KPIData | null>(null)
  const [previousYearKpis, setPreviousYearKpis] = useState<KPIData | null>(null)
  const [timeSeriesData, setTimeSeriesData] = useState<RevenueTimeSeriesData[]>([])
  const [channelData, setChannelData] = useState<ChannelRevenueData[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
  
  // Drill-down states (keeping for complex functionality)
  const [selectedProduct, setSelectedProduct] = useState<ProductDrillDown | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDrillDown | null>(null)
  const [enhancedCustomerData, setEnhancedCustomerData] = useState<EnhancedCustomerData | null>(null)
  const [showProductDrillDown, setShowProductDrillDown] = useState(false)
  const [showCustomerDrillDown, setShowCustomerDrillDown] = useState(false)
  const [showEnhancedCustomerPopover, setShowEnhancedCustomerPopover] = useState(false)
  const [selectedCustomerForEnhanced, setSelectedCustomerForEnhanced] = useState<TopCustomer | null>(null)
  
  // Expandable list states
  const [showAllProducts, setShowAllProducts] = useState(false)
  const [showAllCustomers, setShowAllCustomers] = useState(false)

  // Use the page state hook
  const {
    timeframe,
    setTimeframe,
    granularity,
    setGranularity,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    loading,
    error,
    loadData
  } = usePageState({
    onDataLoad: async (filters, granularityParam) => {
      console.log('🔄 Loading sales analysis data with filters:', filters)

      // Load all data in parallel
      const [data, currentKpis, previousYearKpis, timeSeriesWithGranularity] = await Promise.all([
        getSalesAnalysisData(filters, HARDCODED_MERCHANT_ID),
        getKPIs(filters, HARDCODED_MERCHANT_ID).catch(err => {
          console.error('❌ Error loading current KPIs:', err)
          return null
        }),
        getPreviousYearKPIs(filters, HARDCODED_MERCHANT_ID).catch(err => {
          console.error('❌ Error loading previous year KPIs:', err)
          return null
        }),
        getRevenueTimeSeries(filters, granularityParam as any, HARDCODED_MERCHANT_ID)
      ])
      
      setKpis(data.kpis)
      setEnhancedKpis(currentKpis)
      setPreviousYearKpis(previousYearKpis)
      setTimeSeriesData(timeSeriesWithGranularity)
      setChannelData(data.channelData)
      setTopProducts(data.topProducts)
      setTopCustomers(data.topCustomers)
    }
  })

  // Handle product drill-down
  const handleProductClick = async (product: TopProduct) => {
    try {
      const dateRange = getDateRangeFromTimeframe(timeframe, customStartDate, customEndDate)
      const filters: FilterState = { 
        startDate: formatDateForSQL(dateRange.startDate), 
        endDate: formatDateForSQL(dateRange.endDate) 
      }
      
      const drillDownData = await getProductDrillDown(product.id, filters, HARDCODED_MERCHANT_ID)
      if (drillDownData) {
        setSelectedProduct(drillDownData)
        setShowProductDrillDown(true)
      }
    } catch (error) {
      console.error('❌ Error loading product drill-down:', error)
    }
  }

  // Handle customer drill-down
  const handleCustomerClick = async (customer: TopCustomer) => {
    try {
      const dateRange = getDateRangeFromTimeframe(timeframe, customStartDate, customEndDate)
      const filters: FilterState = { 
        startDate: formatDateForSQL(dateRange.startDate), 
        endDate: formatDateForSQL(dateRange.endDate) 
      }
      
      const drillDownData = await getCustomerDrillDown(customer.id, filters, HARDCODED_MERCHANT_ID)
      if (drillDownData) {
        setSelectedCustomer(drillDownData)
        setShowCustomerDrillDown(true)
      }
    } catch (error) {
      console.error('❌ Error loading customer drill-down:', error)
    }
  }

  // Handle enhanced customer analysis
  const handleEnhancedCustomerAnalysis = async (customer: TopCustomer) => {
    try {
      const dateRange = getDateRangeFromTimeframe(timeframe, customStartDate, customEndDate)
      const filters: FilterState = { 
        startDate: formatDateForSQL(dateRange.startDate), 
        endDate: formatDateForSQL(dateRange.endDate) 
      }
      
      const enhancedData = await getEnhancedCustomerData(customer.id, filters, HARDCODED_MERCHANT_ID)
      if (enhancedData) {
        setEnhancedCustomerData(enhancedData)
        setSelectedCustomerForEnhanced(customer)
        setShowEnhancedCustomerPopover(true)
      }
    } catch (error) {
      console.error('❌ Error loading enhanced customer data:', error)
    }
  }

  // Format date based on granularity
  const formatDateForGranularity = (dateString: string, granularity: string) => {
    const date = new Date(dateString)
    
    switch (granularity) {
      case 'daily':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })
      case 'weekly':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        return `w/c ${weekStart.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })}`
      case 'monthly':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        })
      case 'quarterly':
        const quarter = Math.floor(date.getMonth() / 3) + 1
        return `Q${quarter} ${date.getFullYear()}`
      case 'yearly':
        return date.getFullYear().toString()
      default:
        return date.toLocaleDateString()
    }
  }

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-sm">
          <p className="font-medium text-black">{formatDateForGranularity(label, granularity)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-light" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Revenue') ? `$${entry.value.toLocaleString()}` : entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Layout loading={loading} loadingMessage="Loading sales analysis...">
      <PageHeader
        title="Sales Analysis"
        description="Revenue trends and performance insights"
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

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 font-light">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <KPIGrid
        currentKpis={enhancedKpis}
        previousKpis={previousYearKpis}
        variant="enhanced"
      />

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Over Time */}
        <ChartCard
          title="Revenue Over Time"
          description={`${granularity.charAt(0).toUpperCase() + granularity.slice(1)} revenue trend`}
          hasData={timeSeriesData.length > 0}
          noDataMessage="No revenue data available for the selected period"
          noDataIcon={<TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  stroke="#666"
                  tickFormatter={(value) => formatDateForGranularity(value, granularity)}
                />
                <YAxis fontSize={12} stroke="#666" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.1}
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Order Volume vs Revenue */}
        <ChartCard
          title="Order Volume vs Revenue"
          description="Dual-axis view of orders and revenue correlation"
          hasData={timeSeriesData.length > 0}
          noDataMessage="No order data available for the selected period"
          noDataIcon={<ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  stroke="#666"
                  tickFormatter={(value) => formatDateForGranularity(value, granularity)}
                />
                <YAxis yAxisId="left" fontSize={12} stroke="#666" tickFormatter={(value) => value.toLocaleString()} />
                <YAxis yAxisId="right" orientation="right" fontSize={12} stroke="#666" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="left" dataKey="orders" fill="#10b981" name="Orders" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Average Order Value Trend */}
        <ChartCard
          title="Average Order Value Trend"
          description="Track pricing and bundling effectiveness"
          hasData={timeSeriesData.length > 0}
          noDataMessage="No AOV data available for the selected period"
          noDataIcon={<Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  stroke="#666"
                  tickFormatter={(value) => formatDateForGranularity(value, granularity)}
                />
                <YAxis fontSize={12} stroke="#666" tickFormatter={(value) => `$${value.toFixed(0)}`} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="avgOrderValue" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="AOV"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Revenue by Channel */}
        <ChartCard
          title="Revenue by Channel"
          description="Channel performance breakdown"
          hasData={channelData.length > 0}
          noDataMessage="No channel data available for the selected period"
          noDataIcon={<User className="w-12 h-12 mx-auto mb-4 text-gray-300" />}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ channel, percentage }) => `${channel}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Top Products and Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top 10 Products */}
        <ChartCard
          title="Top 10 Products"
          description="Best performing products by revenue"
          hasData={topProducts.length > 0}
          noDataMessage="No product data available for the selected period"
          noDataIcon={<Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />}
        >
          <div className="space-y-3">
            {topProducts.slice(0, showAllProducts ? 10 : 5).map((product, index) => (
              <div 
                key={product.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => handleProductClick(product)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-black text-sm">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      {product.quantity} units • {product.orders} orders
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="font-medium text-black text-sm">${product.revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">${product.avgOrderValue.toFixed(0)} AOV</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
            
            {topProducts.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllProducts(!showAllProducts)}
                className="w-full mt-3 font-light text-gray-600 hover:text-black"
              >
                {showAllProducts ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Show {Math.min(5, topProducts.length - 5)} More
                  </>
                )}
              </Button>
            )}
          </div>
        </ChartCard>

        {/* Top 10 Customers */}
        <ChartCard
          title="Top 10 Customers"
          description="Highest value customers by revenue"
          hasData={topCustomers.length > 0}
          noDataMessage="No customer data available for the selected period"
          noDataIcon={<User className="w-12 h-12 mx-auto mb-4 text-gray-300" />}
        >
          <div className="space-y-3">
            {topCustomers.slice(0, showAllCustomers ? 10 : 5).map((customer, index) => (
              <Popover key={customer.id}>
                <PopoverTrigger asChild>
                  <div 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-black text-sm">{customer.name}</p>
                        <p className="text-xs text-gray-500">
                          {customer.email} • {customer.orders} orders
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="font-medium text-black text-sm">${customer.revenue.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">${customer.avgOrderValue.toFixed(0)} AOV</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80" side="right">
                  <div className="space-y-4">
                    <div className="border-b pb-3">
                      <h4 className="font-medium text-black">{customer.name}</h4>
                      <p className="text-sm text-gray-600">{customer.email}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                        <p className="font-medium text-black">${customer.revenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Orders</p>
                        <p className="font-medium text-black">{customer.orders}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Avg Order Value</p>
                        <p className="font-medium text-black">${customer.avgOrderValue.toFixed(0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Last Order</p>
                        <p className="font-medium text-black">
                          {new Date(customer.lastOrderDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleEnhancedCustomerAnalysis(customer)}
                      className="w-full font-light"
                      size="sm"
                    >
                      View Full Analysis
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            ))}
            
            {topCustomers.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllCustomers(!showAllCustomers)}
                className="w-full mt-3 font-light text-gray-600 hover:text-black"
              >
                {showAllCustomers ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Show {Math.min(5, topCustomers.length - 5)} More
                  </>
                )}
              </Button>
            )}
          </div>
        </ChartCard>
      </div>

      {/* No Data State */}
      {!loading && (!kpis || (kpis.totalRevenue === null && kpis.totalOrders === null)) && (
        <ChartCard
          title="No Sales Data Available"
          description="We couldn't find any sales data for the selected time period and filters."
          hasData={false}
          noDataMessage="Try adjusting your date range or removing filters to see more data."
          noDataIcon={<TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />}
        >
          <div></div>
        </ChartCard>
      )}

      {/* Debug Panel */}
      <div className="mb-8">
        <DataDebugPanel
          dateRange={{
            startDate: formatDateForSQL(getDateRangeFromTimeframe(timeframe, customStartDate, customEndDate).startDate),
            endDate: formatDateForSQL(getDateRangeFromTimeframe(timeframe, customStartDate, customEndDate).endDate)
          }}
          timeSeriesData={timeSeriesData}
          selectedTimeframe={timeframe}
          granularity={granularity}
          kpis={kpis}
        />
      </div>

      {/* Help Section */}
      <HelpSection 
        title="Sales Analysis Help & Information"
        items={getSalesAnalysisHelpItems()}
        defaultOpen={false}
      />
    </Layout>
  )
}

export default SalesAnalysisPage