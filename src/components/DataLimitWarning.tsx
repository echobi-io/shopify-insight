import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { isLikelyHittingLimit, getTruncationWarning } from '@/lib/utils/supabaseUtils'

interface DataLimitWarningProps {
  dataCount: number
  dataType?: string
  className?: string
}

export function DataLimitWarning({ 
  dataCount, 
  dataType = 'records',
  className = '' 
}: DataLimitWarningProps) {
  const warning = getTruncationWarning(dataCount)
  
  if (!warning) {
    return null
  }

  return (
    <Alert className={`border-amber-200 bg-amber-50 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <strong>Data Limit Notice:</strong> {warning}
        {dataType !== 'records' && (
          <span className="block mt-1 text-sm">
            Consider using more specific date filters to see complete {dataType} data.
          </span>
        )}
      </AlertDescription>
    </Alert>
  )
}

export default DataLimitWarning