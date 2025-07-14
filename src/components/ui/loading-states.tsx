import React from 'react'
import { Loader2, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Basic loading spinner
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <Loader2 
      className={cn('animate-spin text-muted-foreground', sizeClasses[size], className)} 
    />
  )
}

// Loading overlay for components
export interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  message?: string
  className?: string
}

export function LoadingOverlay({ isLoading, children, message = 'Loading...', className }: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          <div className="flex flex-col items-center space-y-2">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground font-medium">{message}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Card skeleton for loading states
export interface CardSkeletonProps {
  showHeader?: boolean
  lines?: number
  className?: string
}

export function CardSkeleton({ showHeader = true, lines = 3, className }: CardSkeletonProps) {
  return (
    <Card className={cn('animate-pulse', className)}>
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </CardContent>
    </Card>
  )
}

// KPI card skeleton
export function KPICardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-4 rounded" />
        </div>
        <Skeleton className="h-8 w-24 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-16" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Chart skeleton
export function ChartSkeleton({ height = 'h-64', className }: { height?: string; className?: string }) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardHeader>
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <div className={cn('bg-muted rounded-lg flex items-end justify-between p-4', height)}>
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className="bg-muted-foreground/20"
              style={{ 
                height: `${Math.random() * 80 + 20}%`, 
                width: '6%' 
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Table skeleton
export interface TableSkeletonProps {
  rows?: number
  columns?: number
  showHeader?: boolean
  className?: string
}

export function TableSkeleton({ rows = 5, columns = 4, showHeader = true, className }: TableSkeletonProps) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardContent className="p-0">
        <div className="overflow-hidden">
          {showHeader && (
            <div className="border-b bg-muted/50 p-4">
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {Array.from({ length: columns }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
          )}
          <div className="divide-y">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div key={rowIndex} className="p-4">
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                  {Array.from({ length: columns }).map((_, colIndex) => (
                    <Skeleton 
                      key={colIndex} 
                      className={`h-4 ${colIndex === 0 ? 'w-3/4' : colIndex === columns - 1 ? 'w-1/2' : 'w-full'}`} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Error state component
export interface ErrorStateProps {
  error: Error
  onRetry?: () => void
  title?: string
  description?: string
  showDetails?: boolean
  className?: string
}

export function ErrorState({ 
  error, 
  onRetry, 
  title = 'Something went wrong',
  description = 'We encountered an error while loading your data.',
  showDetails = false,
  className 
}: ErrorStateProps) {
  const [showFullError, setShowFullError] = React.useState(false)

  const isNetworkError = error.message.includes('fetch') || error.message.includes('network') || error.message.includes('timeout')
  const isTimeoutError = error.message.includes('timeout')

  return (
    <Card className={cn('border-destructive/50', className)}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {isNetworkError ? (
              <WifiOff className="h-8 w-8 text-destructive" />
            ) : (
              <AlertCircle className="h-8 w-8 text-destructive" />
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-destructive">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isTimeoutError 
                  ? 'The request took too long to complete. This might be due to high server load.'
                  : isNetworkError
                  ? 'Please check your internet connection and try again.'
                  : description
                }
              </p>
            </div>

            {showDetails && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-mono text-xs">
                  <button
                    onClick={() => setShowFullError(!showFullError)}
                    className="text-destructive hover:underline"
                  >
                    {showFullError ? 'Hide' : 'Show'} error details
                  </button>
                  {showFullError && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                      {error.stack || error.message}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {onRetry && (
              <div className="flex space-x-2">
                <Button onClick={onRetry} size="sm" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                {isNetworkError && (
                  <Button 
                    onClick={() => window.location.reload()} 
                    size="sm" 
                    variant="ghost"
                  >
                    Reload Page
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Empty state component
export interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ 
  title = 'No data available',
  description = 'There is no data to display at the moment.',
  icon,
  action,
  className 
}: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="p-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            {icon || <AlertCircle className="h-12 w-12 text-muted-foreground" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          {action && (
            <Button onClick={action.onClick} variant="outline">
              {action.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Data state wrapper that handles loading, error, and empty states
export interface DataStateWrapperProps<T> {
  data: T | null
  loading: boolean
  error: Error | null
  onRetry?: () => void
  children: (data: T) => React.ReactNode
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode
  emptyComponent?: React.ReactNode
  isEmpty?: (data: T) => boolean
  className?: string
}

export function DataStateWrapper<T>({
  data,
  loading,
  error,
  onRetry,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  isEmpty = (data: T) => Array.isArray(data) ? data.length === 0 : !data,
  className
}: DataStateWrapperProps<T>) {
  if (loading) {
    return <div className={className}>{loadingComponent || <CardSkeleton />}</div>
  }

  if (error) {
    return (
      <div className={className}>
        {errorComponent || <ErrorState error={error} onRetry={onRetry} />}
      </div>
    )
  }

  if (!data || isEmpty(data)) {
    return (
      <div className={className}>
        {emptyComponent || <EmptyState />}
      </div>
    )
  }

  return <div className={className}>{children(data)}</div>
}

// Connection status indicator
export function ConnectionStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <Alert className="border-destructive bg-destructive/10">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        You're currently offline. Some features may not work properly.
      </AlertDescription>
    </Alert>
  )
}