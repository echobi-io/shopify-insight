import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, AlertTriangle, Target, Users, ShoppingCart, DollarSign, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/settingsUtils'

interface BusinessInsightsProps {
  kpiData?: any
  previousYearKpiData?: any
  productData?: any[]
  topCustomersData?: any[]
  orderTimingData?: any[]
  currency?: string
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
  currency = 'GBP'
}) => {
  const insights: Insight[] = []

  // Revenue Growth Insight
  if (kpiData?.totalRevenue && previousYearKpiData?.totalRevenue) {
    const revenueGrowth = ((kpiData.totalRevenue - previousYearKpiData.totalRevenue) / previousYearKpiData.totalRevenue) * 100
    if (revenueGrowth > 10) {
      insights.push({
        id: 'revenue-growth',
        type: 'positive',
        icon: <TrendingUp className="h-4 w-4" />,
        title: 'Strong Revenue Growth',
        description: `Revenue has increased by ${revenueGrowth.toFixed(1)}% compared to the same period last year`,
        value: `+${revenueGrowth.toFixed(1)}%`,
        trend: 'up'
      })
    } else if (revenueGrowth < -5) {
      insights.push({
        id: 'revenue-decline',
        type: 'warning',
        icon: <TrendingDown className="h-4 w-4" />,
        title: 'Revenue Decline',
        description: `Revenue has decreased by ${Math.abs(revenueGrowth).toFixed(1)}% compared to last year`,
        value: `${revenueGrowth.toFixed(1)}%`,
        trend: 'down'
      })
    }
  }

  // AOV Insight
  if (kpiData?.averageOrderValue && previousYearKpiData?.averageOrderValue) {
    const aovChange = ((kpiData.averageOrderValue - previousYearKpiData.averageOrderValue) / previousYearKpiData.averageOrderValue) * 100
    if (aovChange > 5) {
      insights.push({
        id: 'aov-increase',
        type: 'positive',
        icon: <DollarSign className="h-4 w-4" />,
        title: 'Higher Order Values',
        description: `Average order value has increased by ${aovChange.toFixed(1)}%, indicating customers are spending more per purchase`,
        value: formatCurrency(kpiData.averageOrderValue, currency),
        trend: 'up'
      })
    }
  }

  // Customer Growth Insight
  if (kpiData?.totalCustomers && previousYearKpiData?.totalCustomers) {
    const customerGrowth = ((kpiData.totalCustomers - previousYearKpiData.totalCustomers) / previousYearKpiData.totalCustomers) * 100
    if (customerGrowth > 15) {
      insights.push({
        id: 'customer-growth',
        type: 'positive',
        icon: <Users className="h-4 w-4" />,
        title: 'Customer Base Expansion',
        description: `Customer base has grown by ${customerGrowth.toFixed(1)}%, showing strong market penetration`,
        value: `+${customerGrowth.toFixed(1)}%`,
        trend: 'up'
      })
    }
  }

  // Top Product Performance
  if (productData.length > 0) {
    const topProduct = productData[0]
    if (topProduct?.revenue > 0) {
      const totalRevenue = productData.reduce((sum, p) => sum + (p.revenue || 0), 0)
      const topProductShare = (topProduct.revenue / totalRevenue) * 100
      
      if (topProductShare > 30) {
        insights.push({
          id: 'product-concentration',
          type: 'warning',
          icon: <AlertTriangle className="h-4 w-4" />,
          title: 'Revenue Concentration Risk',
          description: `${topProduct.product} accounts for ${topProductShare.toFixed(1)}% of total revenue. Consider diversifying your product mix`,
          value: `${topProductShare.toFixed(1)}%`
        })
      } else {
        insights.push({
          id: 'top-product',
          type: 'positive',
          icon: <Target className="h-4 w-4" />,
          title: 'Top Performer',
          description: `${topProduct.product} is your best-selling product with ${formatCurrency(topProduct.revenue, currency)} in revenue`,
          value: formatCurrency(topProduct.revenue, currency)
        })
      }
    }
  }

  // Peak Hours Insight
  if (orderTimingData.length > 0) {
    const totalOrders = orderTimingData.reduce((sum, d) => sum + d.order_count, 0)
    const peakHour = orderTimingData.reduce((max, current) => 
      current.order_count > max.order_count ? current : max
    )
    
    if (peakHour.order_count > 0) {
      const peakPercentage = (peakHour.order_count / totalOrders) * 100
      const hourLabel = peakHour.hour === 0 ? '12:00 AM' : 
                       peakHour.hour < 12 ? `${peakHour.hour}:00 AM` : 
                       peakHour.hour === 12 ? '12:00 PM' : 
                       `${peakHour.hour - 12}:00 PM`
      
      insights.push({
        id: 'peak-hours',
        type: 'neutral',
        icon: <Clock className="h-4 w-4" />,
        title: 'Peak Shopping Hour',
        description: `Most orders (${peakPercentage.toFixed(1)}%) come in around ${hourLabel}. Consider timing promotions accordingly`,
        value: hourLabel
      })
    }
  }

  // Customer Loyalty Insight
  if (topCustomersData.length > 0) {
    const topCustomer = topCustomersData[0]
    if (topCustomer?.total_spent > 0) {
      insights.push({
        id: 'top-customer',
        type: 'positive',
        icon: <Users className="h-4 w-4" />,
        title: 'Loyal Customer',
        description: `Your top customer has spent ${formatCurrency(topCustomer.total_spent, currency)} across ${topCustomer.order_count} orders`,
        value: formatCurrency(topCustomer.total_spent, currency)
      })
    }
  }

  // Order Volume Insight
  if (kpiData?.totalOrders && previousYearKpiData?.totalOrders) {
    const orderGrowth = ((kpiData.totalOrders - previousYearKpiData.totalOrders) / previousYearKpiData.totalOrders) * 100
    if (orderGrowth > 20) {
      insights.push({
        id: 'order-growth',
        type: 'positive',
        icon: <ShoppingCart className="h-4 w-4" />,
        title: 'Order Volume Surge',
        description: `Order volume has increased by ${orderGrowth.toFixed(1)}%, indicating strong demand`,
        value: `+${orderGrowth.toFixed(1)}%`,
        trend: 'up'
      })
    }
  }

  // If no insights, show default message
  if (insights.length === 0) {
    insights.push({
      id: 'no-insights',
      type: 'neutral',
      icon: <Target className="h-4 w-4" />,
      title: 'Analyzing Your Data',
      description: 'We\'re analyzing your business data to provide personalized insights. Check back as more data becomes available.',
    })
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
      </CardContent>
    </Card>
  )
}

export default BusinessInsights