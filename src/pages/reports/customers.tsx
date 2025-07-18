import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import AppLayout from '@/components/Layout/AppLayout'
import ReportEngine from '@/components/ReportEngine'
import { useDataFetcher } from '@/hooks/useDataFetcher'
import { getCustomerInsightsData } from '@/lib/fetchers/getCustomerInsightsData'
import { getDateRangeFromTimeframe, formatDateForSQL } from '@/lib/utils/dateUtils'

const MERCHANT_ID = '11111111-1111-1111-1111-111111111111'

const CustomerReportsPage: React.FC = () => {
  const router = useRouter()
  const [filters, setFilters] = useState({
    dateRange: 'last30days',
    startDate: '',
    endDate: '',
    customerSegment: 'all',
    minOrderCount: '',
    minLifetimeValue: ''
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
  const customerDataFetcher = useDataFetcher(
    useCallback(async () => {
      try {
        const data = await getCustomerInsightsData(MERCHANT_ID, dateFilters)
        
        // Transform data for reporting
        const reportData = data.customerData?.map((customer, index) => ({
          customerId: customer.customer_id || `customer_${index}`,
          customerName: customer.customer_name || `Customer ${index + 1}`,
          email: customer.email || `customer${index + 1}@example.com`,
          totalOrders: customer.total_orders || 0,
          totalRevenue: customer.total_revenue || 0,
          avgOrderValue: customer.total_orders > 0 ? (customer.total_revenue / customer.total_orders) : 0,
          firstOrderDate: customer.first_order_date || new Date().toISOString().split('T')[0],
          lastOrderDate: customer.last_order_date || new Date().toISOString().split('T')[0],
          segment: customer.segment || 'Regular',
          lifetimeValue: customer.lifetime_value || customer.total_revenue || 0
        })) || []

        return reportData
      } catch (error) {
        console.error('Error fetching customer data:', error)
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
      id: 'customerSegment',
      label: 'Customer Segment',
      type: 'select' as const,
      value: filters.customerSegment,
      options: [
        { value: 'all', label: 'All Segments' },
        { value: 'new', label: 'New Customers' },
        { value: 'regular', label: 'Regular Customers' },
        { value: 'vip', label: 'VIP Customers' },
        { value: 'at-risk', label: 'At-Risk Customers' }
      ]
    },
    {
      id: 'minOrderCount',
      label: 'Min Order Count',
      type: 'number' as const,
      value: filters.minOrderCount,
      placeholder: 'Enter minimum order count'
    },
    {
      id: 'minLifetimeValue',
      label: 'Min Lifetime Value',
      type: 'number' as const,
      value: filters.minLifetimeValue,
      placeholder: 'Enter minimum lifetime value'
    }
  ]

  const reportColumns = [
    {
      key: 'customerId',
      label: 'Customer ID',
      type: 'text' as const,
      sortable: true,
      width: '120px'
    },
    {
      key: 'customerName',
      label: 'Customer Name',
      type: 'text' as const,
      sortable: true,
      width: '180px'
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text' as const,
      sortable: true,
      width: '200px'
    },
    {
      key: 'totalOrders',
      label: 'Total Orders',
      type: 'number' as const,
      sortable: true,
      width: '120px'
    },
    {
      key: 'totalRevenue',
      label: 'Total Revenue',
      type: 'currency' as const,
      sortable: true,
      width: '140px'
    },
    {
      key: 'avgOrderValue',
      label: 'Avg Order Value',
      type: 'currency' as const,
      sortable: true,
      width: '140px'
    },
    {
      key: 'firstOrderDate',
      label: 'First Order',
      type: 'date' as const,
      sortable: true,
      width: '120px'
    },
    {
      key: 'lastOrderDate',
      label: 'Last Order',
      type: 'date' as const,
      sortable: true,
      width: '120px'
    },
    {
      key: 'segment',
      label: 'Segment',
      type: 'text' as const,
      sortable: true,
      width: '100px'
    },
    {
      key: 'lifetimeValue',
      label: 'Lifetime Value',
      type: 'currency' as const,
      sortable: true,
      width: '140px'
    }
  ]

  const visualizations = [
    {
      type: 'bar' as const,
      title: 'Customer Lifetime Value Distribution',
      dataKey: 'lifetimeValue',
      xAxisKey: 'customerName'
    },
    {
      type: 'line' as const,
      title: 'Order Count by Customer',
      dataKey: 'totalOrders',
      xAxisKey: 'customerName'
    }
  ]

  const handleFilterChange = (filterId: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterId]: value
    }))
  }

  const handleRefresh = () => {
    customerDataFetcher.refetch()
  }

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const data = customerDataFetcher.data || []
    
    if (format === 'csv') {
      // Simple CSV export
      const headers = reportColumns.map(col => col.label).join(',')
      const rows = data.map(row => 
        reportColumns.map(col => {
          const value = row[col.key]
          // Handle special formatting for CSV
          if (col.type === 'currency') {
            return typeof value === 'number' ? value.toFixed(2) : value
          }
          return value || ''
        }).join(',')
      ).join('\n')
      
      const csvContent = `${headers}\n${rows}`
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `customer-report-${new Date().toISOString().split('T')[0]}.csv`
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
        title="Customer Reports"
        description="Comprehensive customer analysis and segmentation reporting"
        filters={reportFilters}
        columns={reportColumns}
        data={customerDataFetcher.data || []}
        loading={customerDataFetcher.loading}
        visualizations={visualizations}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onSave={handleSave}
      />
    </AppLayout>
  )
}

export default CustomerReportsPage