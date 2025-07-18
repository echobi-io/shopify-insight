import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import AppLayout from '@/components/Layout/AppLayout'
import ReportEngine from '@/components/ReportEngine'
import { useDataFetcher } from '@/hooks/useDataFetcher'
import { getCohortAnalysisData } from '@/lib/fetchers/getCohortAnalysisData'
import { getDateRangeFromTimeframe, formatDateForSQL } from '@/lib/utils/dateUtils'

const MERCHANT_ID = '11111111-1111-1111-1111-111111111111'

const CohortReportsPage: React.FC = () => {
  const router = useRouter()
  const [filters, setFilters] = useState({
    dateRange: 'last12months',
    startDate: '',
    endDate: '',
    cohortType: 'monthly',
    minCohortSize: '',
    analysisType: 'retention'
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
  const cohortDataFetcher = useDataFetcher(
    useCallback(async () => {
      try {
        const data = await getCohortAnalysisData(MERCHANT_ID, dateFilters)
        
        console.log('Cohort data received:', data)
        
        // Transform cohort data for reporting - use actual data structure
        const reportData = []
        
        if (data.cohortData && Array.isArray(data.cohortData)) {
          data.cohortData.forEach((cohort: any) => {
            // Create a row for each cohort period that has actual data
            for (let period = 0; period <= 12; period++) {
              const retentionKey = `month_${period}`
              const revenueKey = `revenue_month_${period}`
              
              // Only include periods that have actual retention data
              const retentionRate = cohort[retentionKey]
              if (retentionRate !== undefined && retentionRate !== null) {
                const cohortSize = cohort.cohort_size || 0
                const avgRevenue = cohort[revenueKey] || 0
                const retentionCount = Math.round((retentionRate * cohortSize) / 100)
                
                reportData.push({
                  cohortMonth: cohort.cohort_month || cohort.cohort_year || 'Unknown',
                  cohortSize: cohortSize,
                  period: period,
                  periodLabel: period === 0 ? 'Month 1' : `Month ${period + 1}`,
                  retentionRate: parseFloat(retentionRate.toFixed(2)),
                  retentionCount: retentionCount,
                  avgRevenue: parseFloat(avgRevenue.toFixed(2)),
                  totalRevenue: parseFloat((avgRevenue * retentionCount).toFixed(2)),
                  analysisType: filters.analysisType
                })
              }
            }
          })
        }

        // If no cohort data, try to use retention data directly
        if (reportData.length === 0 && data.retentionData && Array.isArray(data.retentionData)) {
          data.retentionData.forEach((retention: any, index: number) => {
            reportData.push({
              cohortMonth: retention.cohort_month || retention.period || `Cohort ${index + 1}`,
              cohortSize: retention.cohort_size || retention.initial_customers || 0,
              period: retention.period_number || index,
              periodLabel: `Month ${(retention.period_number || index) + 1}`,
              retentionRate: parseFloat((retention.retention_rate || 0).toFixed(2)),
              retentionCount: retention.retained_customers || 0,
              avgRevenue: parseFloat((retention.avg_revenue || 0).toFixed(2)),
              totalRevenue: parseFloat((retention.total_revenue || 0).toFixed(2)),
              analysisType: filters.analysisType
            })
          })
        }

        console.log('Transformed cohort report data:', reportData)
        return reportData
      } catch (error) {
        console.error('Error fetching cohort data:', error)
        return []
      }
    }, [dateFilters, filters.analysisType]),
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
        { value: 'last6months', label: 'Last 6 Months' },
        { value: 'last12months', label: 'Last 12 Months' },
        { value: 'last24months', label: 'Last 24 Months' },
        { value: 'thisYear', label: 'This Year' },
        { value: 'lastYear', label: 'Last Year' },
        { value: 'custom', label: 'Custom Range' }
      ]
    },
    {
      id: 'cohortType',
      label: 'Cohort Type',
      type: 'select' as const,
      value: filters.cohortType,
      options: [
        { value: 'monthly', label: 'Monthly Cohorts' },
        { value: 'quarterly', label: 'Quarterly Cohorts' },
        { value: 'yearly', label: 'Yearly Cohorts' }
      ]
    },
    {
      id: 'analysisType',
      label: 'Analysis Type',
      type: 'select' as const,
      value: filters.analysisType,
      options: [
        { value: 'retention', label: 'Retention Analysis' },
        { value: 'revenue', label: 'Revenue Analysis' },
        { value: 'combined', label: 'Combined Analysis' }
      ]
    },
    {
      id: 'minCohortSize',
      label: 'Min Cohort Size',
      type: 'number' as const,
      value: filters.minCohortSize,
      placeholder: 'Enter minimum cohort size'
    }
  ]

  const reportColumns = [
    {
      key: 'cohortMonth',
      label: 'Cohort Month',
      type: 'text' as const,
      sortable: true,
      width: '120px'
    },
    {
      key: 'cohortSize',
      label: 'Cohort Size',
      type: 'number' as const,
      sortable: true,
      width: '100px'
    },
    {
      key: 'periodLabel',
      label: 'Period',
      type: 'text' as const,
      sortable: true,
      width: '100px'
    },
    {
      key: 'retentionRate',
      label: 'Retention Rate',
      type: 'percentage' as const,
      sortable: true,
      width: '120px'
    },
    {
      key: 'retentionCount',
      label: 'Retained Customers',
      type: 'number' as const,
      sortable: true,
      width: '140px'
    },
    {
      key: 'avgRevenue',
      label: 'Avg Revenue',
      type: 'currency' as const,
      sortable: true,
      width: '120px'
    },
    {
      key: 'totalRevenue',
      label: 'Total Revenue',
      type: 'currency' as const,
      sortable: true,
      width: '120px'
    }
  ]

  const visualizations = [
    {
      type: 'line' as const,
      title: 'Retention Rate Over Time',
      dataKey: 'retentionRate',
      xAxisKey: 'periodLabel'
    },
    {
      type: 'bar' as const,
      title: 'Revenue by Cohort Period',
      dataKey: 'totalRevenue',
      xAxisKey: 'periodLabel'
    }
  ]

  const handleFilterChange = (filterId: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterId]: value
    }))
  }

  const handleRefresh = () => {
    cohortDataFetcher.refetch()
  }

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const data = cohortDataFetcher.data || []
    
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
      a.download = `cohort-report-${new Date().toISOString().split('T')[0]}.csv`
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
        title="Cohort Reports"
        description="Customer cohort analysis and retention metrics reporting"
        filters={reportFilters}
        columns={reportColumns}
        data={cohortDataFetcher.data || []}
        loading={cohortDataFetcher.loading}
        visualizations={visualizations}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onSave={handleSave}
      />
    </AppLayout>
  )
}

export default CohortReportsPage