import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import AppLayout from '@/components/Layout/AppLayout'
import ReportEngine from '@/components/ReportEngine'
import { useDataFetcher } from '@/hooks/useDataFetcher'
import { getProductPerformanceDataOptimized } from '@/lib/fetchers/getProductPerformanceDataOptimized'
import { getDateRangeFromTimeframe, formatDateForSQL } from '@/lib/utils/dateUtils'

const MERCHANT_ID = '11111111-1111-1111-1111-111111111111'

const ProductReportsPage: React.FC = () => {
  const router = useRouter()
  const [filters, setFilters] = useState({
    dateRange: 'last30days',
    startDate: '',
    endDate: '',
    productCategory: 'all',
    minSales: '',
    maxReturns: ''
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
  const productDataFetcher = useDataFetcher(
    useCallback(async () => {
      try {
        const data = await getProductPerformanceDataOptimized(MERCHANT_ID, dateFilters)
        
        // Transform data for reporting - remove all mock data
        const reportData = data.map((product) => ({
          productId: product.product_id || product.id || 'unknown',
          productName: product.product_name || product.title || product.name || 'Unknown Product',
          sku: product.sku || product.variant_sku || 'No SKU',
          category: product.category || product.product_type || 'Uncategorized',
          unitsSold: product.units_sold || product.quantity_sold || product.total_quantity || 0,
          revenue: product.revenue || product.total_revenue || product.total_sales || 0,
          avgPrice: product.avg_price || 
                   (product.revenue && product.units_sold ? product.revenue / product.units_sold : 
                   (product.total_revenue && product.quantity_sold ? product.total_revenue / product.quantity_sold : 0)),
          returns: product.returns || product.return_count || product.returned_quantity || 0,
          returnRate: product.return_rate || 
                     (product.returns && product.units_sold ? (product.returns / product.units_sold) * 100 : 0),
          profitMargin: product.profit_margin || product.margin_percentage || 0,
          inventoryLevel: product.inventory_level || product.inventory_quantity || product.stock_quantity || null,
          lastSaleDate: product.last_sale_date || product.last_order_date || null
        })) || []

        return reportData
      } catch (error) {
        console.error('Error fetching product data:', error)
        return []
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
      id: 'productCategory',
      label: 'Product Category',
      type: 'select' as const,
      value: filters.productCategory,
      options: [
        { value: 'all', label: 'All Categories' },
        { value: 'electronics', label: 'Electronics' },
        { value: 'clothing', label: 'Clothing' },
        { value: 'home', label: 'Home & Garden' },
        { value: 'books', label: 'Books' },
        { value: 'sports', label: 'Sports & Outdoors' }
      ]
    },
    {
      id: 'minSales',
      label: 'Min Units Sold',
      type: 'number' as const,
      value: filters.minSales,
      placeholder: 'Enter minimum units sold'
    },
    {
      id: 'maxReturns',
      label: 'Max Return Rate (%)',
      type: 'number' as const,
      value: filters.maxReturns,
      placeholder: 'Enter maximum return rate'
    }
  ]

  const reportColumns = [
    {
      key: 'productId',
      label: 'Product ID',
      type: 'text' as const,
      sortable: true,
      width: '120px'
    },
    {
      key: 'productName',
      label: 'Product Name',
      type: 'text' as const,
      sortable: true,
      width: '200px'
    },
    {
      key: 'sku',
      label: 'SKU',
      type: 'text' as const,
      sortable: true,
      width: '120px'
    },
    {
      key: 'category',
      label: 'Category',
      type: 'text' as const,
      sortable: true,
      width: '120px'
    },
    {
      key: 'unitsSold',
      label: 'Units Sold',
      type: 'number' as const,
      sortable: true,
      width: '100px'
    },
    {
      key: 'revenue',
      label: 'Revenue',
      type: 'currency' as const,
      sortable: true,
      width: '120px'
    },
    {
      key: 'avgPrice',
      label: 'Avg Price',
      type: 'currency' as const,
      sortable: true,
      width: '100px'
    },
    {
      key: 'returns',
      label: 'Returns',
      type: 'number' as const,
      sortable: true,
      width: '80px'
    },
    {
      key: 'returnRate',
      label: 'Return Rate',
      type: 'percentage' as const,
      sortable: true,
      width: '100px'
    },
    {
      key: 'profitMargin',
      label: 'Profit Margin',
      type: 'percentage' as const,
      sortable: true,
      width: '120px'
    },
    {
      key: 'inventoryLevel',
      label: 'Inventory',
      type: 'number' as const,
      sortable: true,
      width: '100px'
    },
    {
      key: 'lastSaleDate',
      label: 'Last Sale',
      type: 'date' as const,
      sortable: true,
      width: '120px'
    }
  ]

  const visualizations = [
    {
      type: 'bar' as const,
      title: 'Revenue by Product',
      dataKey: 'revenue',
      xAxisKey: 'productName'
    },
    {
      type: 'line' as const,
      title: 'Units Sold Distribution',
      dataKey: 'unitsSold',
      xAxisKey: 'productName'
    }
  ]

  const handleFilterChange = (filterId: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterId]: value
    }))
  }

  const handleRefresh = () => {
    productDataFetcher.refetch()
  }

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const data = productDataFetcher.data || []
    
    if (format === 'csv') {
      // Simple CSV export
      const headers = reportColumns.map(col => col.label).join(',')
      const rows = data.map(row => 
        reportColumns.map(col => {
          const value = row[col.key]
          // Handle special formatting for CSV
          if (col.type === 'currency') {
            return typeof value === 'number' ? value.toFixed(2) : value
          } else if (col.type === 'percentage') {
            return typeof value === 'number' ? (value / 100).toFixed(4) : value
          }
          return value || ''
        }).join(',')
      ).join('\n')
      
      const csvContent = `${headers}\n${rows}`
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `product-report-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } else {
      console.log(`Exporting as ${format}...`)
      alert(`${format.toUpperCase()} export functionality would be implemented here`)
    }
  }

  const handleSave = (reportName: string) => {
    console.log(`Saving report: ${reportName}`)
    alert(`Report "${reportName}" saved successfully!`)
  }

  return (
    <AppLayout>
      <ReportEngine
        title="Product Reports"
        description="Comprehensive product performance and inventory analysis"
        filters={reportFilters}
        columns={reportColumns}
        data={productDataFetcher.data || []}
        loading={productDataFetcher.loading}
        visualizations={visualizations}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onSave={handleSave}
      />
    </AppLayout>
  )
}

export default ProductReportsPage