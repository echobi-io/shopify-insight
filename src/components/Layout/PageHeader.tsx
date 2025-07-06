import React, { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description: string
  actions?: ReactNode
  onRefresh?: () => void
  loading?: boolean
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  onRefresh,
  loading = false
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-black mb-2">{title}</h1>
          <p className="text-gray-600 font-light">{description}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {actions}
          {onRefresh && (
            <Button 
              onClick={onRefresh} 
              variant="outline" 
              size="sm"
              disabled={loading}
              className="font-light"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PageHeader