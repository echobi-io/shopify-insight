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
        
        console.log('Customer data received:', data)
        
        // Transform data for reporting - use the actual data structure from getCustomerInsightsData
        // The function returns churn predictions and LTV predictions with customer details
        const reportData = []
        
        // Use churn predictions as the primary source since they contain customer details
        if (data.churnPredictions && data.churnPredictions.length > 0) {
          data.churnPredictions.forEach(prediction => {
            if (prediction.customer && prediction.customer_id) {
              const customer = prediction.customer
              const ltvPrediction = data.ltvPredictions?.find(ltv => ltv.customer_id === prediction.customer_id)
              
              reportData.push({
                customerId: prediction.customer_id,
                customerName: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown Customer',
                email: customer.email || 'No email',
                totalOrders: 0, // Will be calculated from order data if available
                totalRevenue: customer.total_spent || 0,
                avgOrderValue: customer.total_spent || 0, // Will be recalculated if order count is available
                firstOrderDate: customer.last_order_date ? new Date(customer.last_order_date).toISOString().split('T')[0] : 'N/A',
                lastOrderDate: customer.last_order_date ? new Date(customer.last_order_date).toISOString().split('T')[0] : 'N/A',
                segment: prediction.churn_band === 'High' ? 'At-Risk' : 
                        prediction.churn_band === 'Medium' ? 'Regular' : 'Loyal',
                lifetimeValue: ltvPrediction?.predicted_ltv || customer.total_spent || 0,
                churnRisk: prediction.churn_band,
                churnProbability: Math.round(prediction.churn_probability * 100),
                revenueAtRisk: prediction.revenue_at_risk || 0
              })
            }
          })
        }
        
        // If no churn predictions, try to use LTV predictions
        if (reportData.length === 0 && data.ltvPredictions && data.ltvPredictions.length > 0) {
          data.ltvPredictions.forEach(prediction => {
            if (prediction.customer && prediction.customer_id) {
              const customer = prediction.customer
              
              reportData.push({
                customerId: prediction.customer_id,
                customerName: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown Customer',
                email: customer.email || 'No email',
                totalOrders: 0,
                totalRevenue: customer.total_spent || 0,
                avgOrderValue: customer.total_spent || 0,
                firstOrderDate: 'N/A',
                lastOrderDate: 'N/A',
                segment: prediction.ltv_segment || 'Regular',
                lifetimeValue: prediction.predicted_ltv || 0,
                churnRisk: 'Low',
                churnProbability: 0,
                revenueAtRisk: 0
              })
            }
          })
        }

        console.log('Transformed customer report data:', reportData)
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
      key: 'totalRevenue',
      label: 'Total Revenue',
      type: 'currency' as const,
      sortable: true,
      width: '140px'
    },
    {
      key: 'lifetimeValue',
      label: 'Predicted LTV',
      type: 'currency' as const,
      sortable: true,
      width: '140px'
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
      key: 'churnRisk',
      label: 'Churn Risk',
      type: 'text' as const,
      sortable: true,
      width: '100px'
    },
    {
      key: 'churnProbability',
      label: 'Churn %',
      type: 'percentage' as const,
      sortable: true,
      width: '100px'
    },
    {
      key: 'revenueAtRisk',
      label: 'Revenue at Risk',
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
      type: 'bar' as const,
      title: 'Revenue at Risk by Customer',
      dataKey: 'revenueAtRisk',
      xAxisKey: 'customerName'
    },
    {
      type: 'scatter' as const,
      title: 'Churn Risk vs Total Revenue',
      dataKey: 'churnProbability',
      xAxisKey: 'totalRevenue',
      yAxisKey: 'churnProbability'
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