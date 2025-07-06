import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DateRangeSelector from '@/components/DateRangeSelector'

interface PageFiltersProps {
  timeframe: string
  onTimeframeChange: (value: string) => void
  customStartDate?: string
  customEndDate?: string
  onCustomStartDateChange?: (value: string) => void
  onCustomEndDateChange?: (value: string) => void
  granularity?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  onGranularityChange?: (value: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly') => void
  showGranularity?: boolean
  showCustomInputs?: boolean
}

const PageFilters: React.FC<PageFiltersProps> = ({
  timeframe,
  onTimeframeChange,
  customStartDate = '',
  customEndDate = '',
  onCustomStartDateChange,
  onCustomEndDateChange,
  granularity = 'daily',
  onGranularityChange,
  showGranularity = true,
  showCustomInputs = true
}) => {
  return (
    <div className="flex items-center space-x-4">
      <DateRangeSelector
        value={timeframe}
        onChange={onTimeframeChange}
        showCustomInputs={showCustomInputs}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomStartDateChange={onCustomStartDateChange}
        onCustomEndDateChange={onCustomEndDateChange}
      />
      
      {showGranularity && onGranularityChange && (
        <Select value={granularity} onValueChange={onGranularityChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  )
}

export default PageFilters