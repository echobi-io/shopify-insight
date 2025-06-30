import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, Bug, Calendar, Database } from 'lucide-react'

interface DataDebugPanelProps {
  dateRange: {
    startDate: string
    endDate: string
  }
  timeSeriesData: any[]
  selectedTimeframe: string
  granularity: string
  kpis?: any
}

export const DataDebugPanel: React.FC<DataDebugPanelProps> = ({
  dateRange,
  timeSeriesData,
  selectedTimeframe,
  granularity,
  kpis
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const calculateDateRangeDays = () => {
    const start = new Date(dateRange.startDate)
    const end = new Date(dateRange.endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDataRangeDays = () => {
    if (timeSeriesData.length === 0) return 0
    
    const sortedData = [...timeSeriesData].sort((a, b) => a.date.localeCompare(b.date))
    const firstDate = new Date(sortedData[0].date)
    const lastDate = new Date(sortedData[sortedData.length - 1].date)
    const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const expectedDataPoints = () => {
    const days = calculateDateRangeDays()
    switch (granularity) {
      case 'daily': return days
      case 'weekly': return Math.ceil(days / 7)
      case 'monthly': return Math.ceil(days / 30)
      case 'quarterly': return Math.ceil(days / 90)
      case 'yearly': return Math.ceil(days / 365)
      default: return days
    }
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-orange-100 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bug className="w-5 h-5 text-orange-600" />
                <CardTitle className="text-lg font-medium text-orange-800">
                  Data Debug Panel
                </CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="p-0">
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-orange-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-orange-600" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Date Range Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  <h4 className="font-medium text-orange-800">Selected Date Range</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timeframe:</span>
                    <span className="font-medium text-gray-800">{selectedTimeframe}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="font-medium text-gray-800">{formatDate(dateRange.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">End Date:</span>
                    <span className="font-medium text-gray-800">{formatDate(dateRange.endDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Days:</span>
                    <span className="font-medium text-gray-800">{calculateDateRangeDays()} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Granularity:</span>
                    <span className="font-medium text-gray-800">{granularity}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Database className="w-4 h-4 text-orange-600" />
                  <h4 className="font-medium text-orange-800">Actual Data Returned</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data Points:</span>
                    <span className="font-medium text-gray-800">{timeSeriesData.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected Points:</span>
                    <span className="font-medium text-gray-800">~{expectedDataPoints()}</span>
                  </div>
                  {timeSeriesData.length > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">First Data Point:</span>
                        <span className="font-medium text-gray-800">
                          {formatDate(timeSeriesData.sort((a, b) => a.date.localeCompare(b.date))[0].date)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Data Point:</span>
                        <span className="font-medium text-gray-800">
                          {formatDate(timeSeriesData.sort((a, b) => b.date.localeCompare(a.date))[0].date)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Data Span:</span>
                        <span className="font-medium text-gray-800">{getDataRangeDays()} days</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Data Quality Check */}
            <div className="bg-white p-4 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-800 mb-3">Data Quality Analysis</h4>
              <div className="space-y-2 text-sm">
                {timeSeriesData.length === 0 && (
                  <div className="text-red-600 font-medium">
                    ⚠️ No data returned - this could indicate:
                    <ul className="list-disc list-inside mt-1 ml-4 text-red-500">
                      <li>No orders exist for the selected date range</li>
                      <li>Database connection issues</li>
                      <li>Incorrect merchant ID or filters</li>
                    </ul>
                  </div>
                )}
                
                {timeSeriesData.length > 0 && timeSeriesData.length < expectedDataPoints() * 0.5 && (
                  <div className="text-yellow-600 font-medium">
                    ⚠️ Limited data returned ({timeSeriesData.length} vs expected ~{expectedDataPoints()})
                    <ul className="list-disc list-inside mt-1 ml-4 text-yellow-500">
                      <li>Data may be sparse for the selected period</li>
                      <li>Some days/periods may have no orders</li>
                    </ul>
                  </div>
                )}
                
                {timeSeriesData.length > 0 && getDataRangeDays() < calculateDateRangeDays() * 0.8 && (
                  <div className="text-yellow-600 font-medium">
                    ⚠️ Data span ({getDataRangeDays()} days) is shorter than selected range ({calculateDateRangeDays()} days)
                    <ul className="list-disc list-inside mt-1 ml-4 text-yellow-500">
                      <li>Data may not be available for the full selected period</li>
                      <li>Check if orders exist for the entire date range</li>
                    </ul>
                  </div>
                )}
                
                {timeSeriesData.length > 0 && getDataRangeDays() >= calculateDateRangeDays() * 0.8 && (
                  <div className="text-green-600 font-medium">
                    ✅ Data looks good - {timeSeriesData.length} data points spanning {getDataRangeDays()} days
                  </div>
                )}
              </div>
            </div>

            {/* Sample Data */}
            {timeSeriesData.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-800 mb-3">Sample Data Points</h4>
                <div className="text-xs font-mono space-y-1 max-h-32 overflow-y-auto">
                  {timeSeriesData.slice(0, 5).map((point, index) => (
                    <div key={index} className="text-gray-600">
                      {point.date}: ${point.revenue?.toLocaleString() || 0} revenue, {point.orders || 0} orders
                    </div>
                  ))}
                  {timeSeriesData.length > 5 && (
                    <div className="text-gray-500">... and {timeSeriesData.length - 5} more data points</div>
                  )}
                </div>
              </div>
            )}

            {/* KPI Debug */}
            {kpis && (
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-800 mb-3">KPI Values</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Total Revenue: ${kpis.totalRevenue?.toLocaleString() || 'N/A'}</div>
                  <div>Total Orders: {kpis.totalOrders?.toLocaleString() || 'N/A'}</div>
                  <div>Avg Order Value: ${kpis.avgOrderValue?.toFixed(2) || 'N/A'}</div>
                  <div>Revenue Growth: {kpis.revenueGrowth ? `${kpis.revenueGrowth}%` : 'N/A'}</div>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export default DataDebugPanel