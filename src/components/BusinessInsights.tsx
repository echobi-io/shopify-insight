import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, AlertTriangle, Target, Users, ShoppingCart, DollarSign, Clock, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/settingsUtils'
import { generateAIInsights } from '@/lib/utils/aiInsights'

interface BusinessInsightsProps {
  kpiData?: any
  previousYearKpiData?: any
  productData?: any[]
  topCustomersData?: any[]
  orderTimingData?: any[]
  currency?: string
  dateRange?: {
    startDate: string
    endDate: string
  }
}

interface Insight {
  id: string
  type: 'positive' | 'negative' | 'neutral' | 'warning'
  icon: React.ReactNode
  title: string
  description: string
  value?: string
  trend?: 'up' | 'down' | 'stable'
}

const BusinessInsights: React.FC<BusinessInsightsProps> = ({
  kpiData,
  previousYearKpiData,
  productData = [],
  topCustomersData = [],
  orderTimingData = [],
  currency = 'GBP',
  dateRange
}) => {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
=======

  // Generate AI insights when data changes
  useEffect(() => {
    const generateInsights = async () => {
      if (!kpiData && !productData.length && !topCustomersData.length) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const aiInsights = await generateAIInsights({
          kpiData,
          previousYearKpiData,
          productData,
          topCustomersData,
          orderTimingData,
          currency,
          dateRange
        })

        // Convert AI insights to component format
        const formattedInsights: Insight[] = aiInsights.map(insight => ({
          id: insight.id,
          type: insight.type,
          icon: getInsightIcon(insight.type),
          title: insight.title,
          description: insight.description,
          value: insight.value,
          trend: insight.trend
        }))

        setInsights(formattedInsights)
      } catch (err) {
        console.error('Failed to generate AI insights:', err)
        setError('Failed to generate insights')
        
        // Fallback insight
        setInsights([{
          id: 'ai-error',
          type: 'neutral',
          icon: <Target className="h-4 w-4" />,
          title: 'AI Analysis Unavailable',
          description: 'Unable to generate AI insights at this time. Please check your connection and try again.',
        }])
      } finally {
        setLoading(false)
      }
    }

    generateInsights()
  }, [kpiData, previousYearKpiData, productData, topCustomersData, orderTimingData, currency, dateRange])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="h-4 w-4" />
      case 'negative':
        return <TrendingDown className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const getInsightStyle = (type: Insight['type']) => {
    switch (type) {
      case 'positive':
        return 'border-green-200 bg-green-50'
      case 'negative':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  const getInsightBadge = (type: Insight['type']) => {
    switch (type) {
      case 'positive':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Opportunity</Badge>
      case 'negative':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">Alert</Badge>
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Watch</Badge>
      default:
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Insight</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Business Insights
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          AI-powered insights based on your business performance
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Generating AI insights...</span>
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-sm font-medium mb-2">No Data Available</h3>
            <p className="text-sm text-muted-foreground">
              We need more business data to generate meaningful insights. Check back once you have orders and customer data.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.slice(0, 6).map((insight) => (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border ${getInsightStyle(insight.type)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {insight.icon}
                    <h3 className="font-medium text-sm">{insight.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {insight.value && (
                      <span className="text-sm font-medium">{insight.value}</span>
                    )}
                    {insight.trend && (
                      <div className="flex items-center">
                        {insight.trend === 'up' ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : insight.trend === 'down' ? (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        ) : null}
                      </div>
                    )}
                    {getInsightBadge(insight.type)}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default BusinessInsights