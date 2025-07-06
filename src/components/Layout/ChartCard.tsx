import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
  hasData?: boolean
  noDataMessage?: string
  noDataIcon?: React.ReactNode
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  children,
  hasData = true,
  noDataMessage = "No data available",
  noDataIcon
}) => {
  return (
    <Card className="card-minimal">
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
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              {noDataIcon}
              <p className="font-light">{noDataMessage}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ChartCard