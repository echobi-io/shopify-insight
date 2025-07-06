import React, { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

interface ChartCardProps {
  title: string
  description?: string
  children: ReactNode
  hasData?: boolean
  noDataMessage?: string
  noDataIcon?: ReactNode
  className?: string
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  children,
  hasData = true,
  noDataMessage = "No data available",
  noDataIcon,
  className = "card-minimal"
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-medium text-black">{title}</CardTitle>
        {description && (
          <CardDescription className="font-light text-gray-600">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {hasData ? (
          children
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              {noDataIcon || <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />}
              <p className="text-sm font-light text-gray-500">{noDataMessage}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ChartCard