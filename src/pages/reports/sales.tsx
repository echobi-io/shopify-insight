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
        console.log('📈 Time series data length:', data.timeSeriesData?.length || 0)
        console.log('🏪 Channel data:', data.channelData)
        
        // Transform time series data for reporting
        const reportData = data.timeSeriesData?.map((item, index) => ({
          date: item.date,
          revenue: item.revenue || 0,
          orders: item.orders || 0,
          avgOrderValue: item.avgOrderValue || 0,
          // Distribute channel data across time series entries
          channel: data.channelData?.[index % (data.channelData?.length || 1)]?.channel || 'Online',
          category: 'All Products'
        })) || []

        console.log('✅ Transformed report data:', reportData)
        console.log('📊 Report data length:', reportData.length)
        
        if (reportData.length === 0) {
          console.warn('⚠️ No report data generated - checking raw data:')
          console.log('- Time series data:', data.timeSeriesData)
          console.log('- Date filters used:', dateFilters)
        }
        
        return reportData
      } catch (error) {
        console.error('❌ Error fetching sales data:', error)
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
      key: 'revenue',
      label: 'Revenue',
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
      title: 'Daily Revenue',
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

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const data = salesDataFetcher.data || []
    
    if (format === 'csv') {
      // Simple CSV export
      const headers = reportColumns.map(col => col.label).join(',')
      const rows = data.map(row => 
        reportColumns.map(col => row[col.key] || '').join(',')
      ).join('\n')
      
      const csvContent = `${headers}\n${rows}`
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } else {
      // For Excel and PDF, you would implement more sophisticated export logic
      console.log(`Exporting as ${format}...`)
      alert(`${format.toUpperCase()} export functionality would be implemented here`)
    }
  }

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
        onExport={handleExport}
        onSave={handleSave}
      />
    </AppLayout>
  )
}

export default SalesReportsPage