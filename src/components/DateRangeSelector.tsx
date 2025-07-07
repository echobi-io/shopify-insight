import React, { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar, Info, HelpCircle } from 'lucide-react'
import { getSettingsSync, getFinancialYearDates } from '@/lib/utils/settingsUtils'

interface DateRangeSelectorProps {
  value: string
  onChange: (value: string) => void
  showCustomInputs?: boolean
  customStartDate?: string
  customEndDate?: string
  onCustomStartDateChange?: (date: string) => void
  onCustomEndDateChange?: (date: string) => void
  className?: string
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  value,
  onChange,
  showCustomInputs = false,
  customStartDate = '',
  customEndDate = '',
  onCustomStartDateChange,
  onCustomEndDateChange,
  className = ''
}) => {
  const [showHelp, setShowHelp] = useState(false)
  const settings = getSettingsSync()
  
  // Get current financial year dates for display
  const currentYear = new Date().getFullYear()
  const currentFinancialYear = getFinancialYearDates(currentYear)
  const previousFinancialYear = getFinancialYearDates(currentYear - 1)
  
  // Helper function to get FY label
  const getFYLabel = (year: number) => {
    const { endDate } = getFinancialYearDates(year)
    const fyYear = endDate.getFullYear().toString().slice(-2) // Get last 2 digits of ending year
    return `FY${fyYear}`
  }

  const timeframeOptions = [
    { 
      value: 'last_7_days', 
      label: 'Last 7 Days',
      type: 'relative'
    },
    { 
      value: 'last_30_days', 
      label: 'Last 30 Days',
      type: 'relative'
    },
    { 
      value: 'last_90_days', 
      label: 'Last 90 Days',
      type: 'relative'
    },
    { 
      value: 'last_6_months', 
      label: 'Last 6 Months',
      type: 'relative'
    },
    { 
      value: 'last_year', 
      label: 'Last Year (365 days)',
      type: 'relative'
    },
    { 
      value: 'this_month', 
      label: 'This Calendar Month',
      type: 'calendar'
    },
    { 
      value: 'this_year', 
      label: 'This Calendar Year',
      type: 'calendar'
    },
    { 
      value: 'calendar_2024', 
      label: 'Calendar Year 2024',
      type: 'calendar'
    },
    { 
      value: 'calendar_2023', 
      label: 'Calendar Year 2023',
      type: 'calendar'
    },
    { 
      value: 'financial_current', 
      label: `Current Financial Year (${getFYLabel(currentYear)})`,
      type: 'financial'
    },
    { 
      value: 'financial_previous', 
      label: `Previous Financial Year (${getFYLabel(currentYear - 1)})`,
      type: 'financial'
    },
    { 
      value: 'custom', 
      label: 'Custom Range',
      type: 'custom'
    }
  ]

  const getHelpContent = () => (
    <div className="space-y-4 max-w-sm">
      <div>
        <h4 className="font-medium text-black mb-2">Date Range Types</h4>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-blue-600">Relative:</span>
            <p className="text-gray-600 font-light">Rolling periods from today (e.g., last 30 days)</p>
          </div>
          <div>
            <span className="font-medium text-green-600">Calendar:</span>
            <p className="text-gray-600 font-light">Standard calendar periods (Jan-Dec)</p>
          </div>
          <div>
            <span className="font-medium text-purple-600">Financial:</span>
            <p className="text-gray-600 font-light">Based on your financial year settings ({settings.financialYearStart} to {settings.financialYearEnd})</p>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-black mb-2">Why Different Date Types?</h4>
        <p className="text-sm text-gray-600 font-light">
          Different businesses have different reporting needs. Financial years may not align with calendar years, 
          and relative periods help track recent performance trends.
        </p>
      </div>
      
      <div>
        <h4 className="font-medium text-black mb-2">Data Availability</h4>
        <p className="text-sm text-gray-600 font-light">
          All charts and analytics respect your selected date range. If you see limited data, 
          it may be because there's no data available for the selected period.
        </p>
      </div>
    </div>
  )

  const getOptionColor = (type: string) => {
    switch (type) {
      case 'relative': return 'text-blue-600'
      case 'calendar': return 'text-green-600'
      case 'financial': return 'text-purple-600'
      case 'custom': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {timeframeOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${
                  option.type === 'relative' ? 'bg-blue-500' :
                  option.type === 'calendar' ? 'bg-green-500' :
                  option.type === 'financial' ? 'bg-purple-500' :
                  'bg-orange-500'
                }`} />
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {showCustomInputs && value === 'custom' && (
        <>
          <Input
            type="date"
            value={customStartDate}
            onChange={(e) => onCustomStartDateChange?.(e.target.value)}
            className="w-40"
            placeholder="Start Date"
          />
          <Input
            type="date"
            value={customEndDate}
            onChange={(e) => onCustomEndDateChange?.(e.target.value)}
            className="w-40"
            placeholder="End Date"
          />
        </>
      )}
      
      <Popover open={showHelp} onOpenChange={setShowHelp}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
            <HelpCircle className="w-4 h-4 text-gray-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" side="bottom" align="end">
          {getHelpContent()}
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default DateRangeSelector