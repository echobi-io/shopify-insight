import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import AppLayout from '@/components/Layout/AppLayout'
import ReportEngine from '@/components/ReportEngine'
import { useDataFetcher } from '@/hooks/useDataFetcher'
import { getSalesAnalysisData } from '@/lib/fetchers/getSalesAnalysisData'
import { getDateRangeFromTimeframe, formatDateForSQL } from '@/lib/utils/dateUtils'

const MERCHANT_ID = '11111111-1111-1111-1111-111111111111'

const SalesReportsPage: React.FC = () => {
  const router = useRouter()
  const [filters, setFilters] = useState({
    dateRange: 'last30days',
    startDate: '',
    endDate: '',
    channel: 'all',
    productCategory: 'all',
    product_name: '',
    minOrderValue: ''
  })

  // Calculate date filters
  const dateFilters = React.useMemo(() => {
    const dateRange = getDateRangeFromTimeframe(filters.dateRange, filters.startDate, filters.endDate)
    return {
      startDate: formatDateForSQL(dateRange.startDate),
      endDate: formatDateForSQL(dateRange.endDate)
    }
  }, [filters.dateRange, filters.startDate, filters.endDate])

  // Data fetcher
  const salesDataFetcher = useDataFetcher(
    useCallback(async () => {
      try {
        console.log('🔍 Fetching sales data with date filters:', dateFilters)
        const data = await getSalesAnalysisData(dateFilters, MERCHANT_ID)
        
        console.log('📊 Sales data received:', data)
        console.log('📈 Time series data:', data.timeSeriesData)
        console.log('📈 Time series data length:', data.timeSeriesData?.length || 0)
        console.log('🏪 Channel data:', data.channelData)
        console.log('🏆 Top products:', data.topProducts)
        console.log('👥 Top customers:', data.topCustomers)
        
        // Check if we have any data at all
        if (!data.timeSeriesData || data.timeSeriesData.length === 0) {
          console.warn('⚠️ No time series data available')
          
          // Try to create report data from other sources if available
          if (data.kpis && (data.kpis.totalRevenue || data.kpis.totalOrders)) {
            console.log('🔄 Creating single row from KPIs data')
            const reportData = [{
              date: dateFilters.endDate.split('T')[0], // Use end date
              revenue: data.kpis.totalRevenue || 0,
              orders: data.kpis.totalOrders || 0,
              avgOrderValue: data.kpis.avgOrderValue || 0,
              channel: data.kpis.topChannel || 'Online',
              category: 'All Products',
              product_name: 'All Products',
              product_sku: 'N/A',
              product_revenue: data.kpis.totalRevenue || 0,
              product_quantity: data.kpis.totalOrders || 0,
              product_units_sold: data.kpis.totalOrders || 0
            }]
            
            console.log('✅ Created report data from KPIs:', reportData)
            return {
              data: reportData,
              error: null,
              loading: false,
              success: true
            }
          }
          
          console.warn('⚠️ No data available from any source')
          return {
            data: [],
            error: null,
            loading: false,
            success: true
          }
        }
        
        // Transform time series data for reporting - now including product information
        let reportData = []
        
        if (data.topProducts && data.topProducts.length > 0) {
          // Create detailed rows with product information
          reportData = data.topProducts.slice(0, 20).map((product, index) => ({
            date: data.timeSeriesData[0]?.date || dateFilters.endDate.split('T')[0],
            revenue: product.revenue || 0,
            orders: product.orders || 0,
            avgOrderValue: product.revenue && product.orders ? (product.revenue / product.orders) : 0,
            channel: data.channelData?.[index % (data.channelData?.length || 1)]?.channel || 'Online',
            category: 'All Products',
            product_name: product.name || product.title || 'Unknown Product',
            product_sku: product.sku || product.id || 'N/A',
            product_revenue: product.revenue || 0,
            product_quantity: product.quantity || product.orders || 0,
            product_units_sold: product.unitsSold || product.quantity || 0
          }))
        } else {
          // Fallback to time series data without detailed product info
          reportData = data.timeSeriesData.map((item, index) => ({
            date: item.date,
            revenue: item.revenue || 0,
            orders: item.orders || 0,
            avgOrderValue: item.avgOrderValue || 0,
            channel: data.channelData?.[index % (data.channelData?.length || 1)]?.channel || 'Online',
            category: 'All Products',
            product_name: 'Multiple Products',
            product_sku: 'N/A',
            product_revenue: item.revenue || 0,
            product_quantity: item.orders || 0,
            product_units_sold: item.orders || 0
          }))
        }

        console.log('✅ Transformed report data:', reportData)
        console.log('📊 Report data length:', reportData.length)
        
        return {
          data: reportData,
          error: null,
          loading: false,
          success: true
        }
      } catch (error) {
        console.error('❌ Error fetching sales data:', error)
        return {
          data: [],
          error: error instanceof Error ? error : new Error(String(error)),
          loading: false,
          success: false
        }
      }
    }, [dateFilters]),
    {
      enabled: true,
      refetchOnWindowFocus: false
    }
  )

  const reportFilters = [
    {
      id: 'dateRange',
      label: 'Date Range',
      type: 'select' as const,
      value: filters.dateRange,
      options: [
        { value: 'today', label: 'Today' },
        { value: 'yesterday', label: 'Yesterday' },
        { value: 'last7days', label: 'Last 7 Days' },
        { value: 'last30days', label: 'Last 30 Days' },
        { value: 'last90days', label: 'Last 90 Days' },
        { value: 'thisMonth', label: 'This Month' },
        { value: 'lastMonth', label: 'Last Month' },
        { value: 'thisYear', label: 'This Year' },
        { value: 'custom', label: 'Custom Range' }
      ]
    },
    {
      id: 'channel',
      label: 'Sales Channel',
      type: 'select' as const,
      value: filters.channel,
      options: [
        { value: 'all', label: 'All Channels' },
        { value: 'online', label: 'Online' },
        { value: 'pos', label: 'Point of Sale' },
        { value: 'mobile', label: 'Mobile App' }
      ]
    },
    {
      id: 'productCategory',
      label: 'Product Category',
      type: 'select' as const,
      value: filters.productCategory,
      options: [
        { value: 'all', label: 'All Categories' },
        { value: 'electronics', label: 'Electronics' },
        { value: 'clothing', label: 'Clothing' },
        { value: 'home', label: 'Home & Garden' }
      ]
    },
    {
      id: 'product_name',
      label: 'Product Name',
      type: 'text' as const,
      value: filters.product_name || '',
      placeholder: 'Search by product name'
    },
    {
      id: 'minOrderValue',
      label: 'Min Order Value',
      type: 'number' as const,
      value: filters.minOrderValue,
      placeholder: 'Enter minimum order value'
    }
  ]

  const reportColumns = [
    {
      key: 'date',
      label: 'Date',
      type: 'date' as const,
      sortable: true,
      width: '120px'
    },
    {
      key: 'product_name',
      label: 'Product Name',
      type: 'text' as const,
      sortable: true,
      width: '200px'
    },
    {
      key: 'product_sku',
      label: 'SKU',
      type: 'text' as const,
      sortable: true,
      width: '120px'
    },
    {
      key: 'product_revenue',
      label: 'Product Revenue',
      type: 'currency' as const,
      sortable: true,
      width: '140px'
    },
    {
      key: 'product_units_sold',
      label: 'Units Sold',
      type: 'number' as const,
      sortable: true,
      width: '100px'
    },
    {
      key: 'revenue',
      label: 'Total Revenue',
      type: 'currency' as const,
      sortable: true,
      width: '120px'
    },
    {
      key: 'orders',
      label: 'Orders',
      type: 'number' as const,
      sortable: true,
      width: '100px'
    },
    {
      key: 'avgOrderValue',
      label: 'Avg Order Value',
      type: 'currency' as const,
      sortable: true,
      width: '140px'
    },
    {
      key: 'channel',
      label: 'Channel',
      type: 'text' as const,
      sortable: true,
      width: '120px'
    },
    {
      key: 'category',
      label: 'Category',
      type: 'text' as const,
      sortable: true,
      width: '140px'
    }
  ]

  const visualizations = [
    {
      type: 'bar' as const,
      title: 'Product Revenue',
      dataKey: 'product_revenue',
      xAxisKey: 'product_name'
    },
    {
      type: 'bar' as const,
      title: 'Units Sold by Product',
      dataKey: 'product_units_sold',
      xAxisKey: 'product_name'
    },
    {
      type: 'line' as const,
      title: 'Daily Revenue Trend',
      dataKey: 'revenue',
      xAxisKey: 'date'
    },
    {
      type: 'line' as const,
      title: 'Order Volume Trend',
      dataKey: 'orders',
      xAxisKey: 'date'
    }
  ]

  const handleFilterChange = (filterId: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterId]: value
    }))
  }

  const handleRefresh = () => {
    salesDataFetcher.refetch()
  }

  // Export functionality is now handled internally by ReportEngine

  const handleSave = (reportName: string) => {
    // Save report logic would go here
    console.log(`Saving report: ${reportName}`)
    alert(`Report "${reportName}" saved successfully!`)
  }

  return (
    <AppLayout>
      <ReportEngine
        title="Sales Reports"
        description="Comprehensive sales performance analysis and reporting"
        filters={reportFilters}
        columns={reportColumns}
        data={salesDataFetcher.data || []}
        loading={salesDataFetcher.loading}
        visualizations={visualizations}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}

        onSave={handleSave}
      />
    </AppLayout>
  )
}

export default SalesReportsPage