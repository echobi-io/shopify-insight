import React from 'react'
import { DollarSign, ShoppingCart, Users, Target } from 'lucide-react'
import DetailedKPICard from '@/components/DetailedKPICard'
import EnhancedKPICard from '@/components/EnhancedKPICard'
import { KPIData } from '@/lib/fetchers/getKpis'

interface KPIGridProps {
  currentKpis: KPIData | null
  previousKpis?: KPIData | null
  detailedData?: {
    revenue?: any[]
    orders?: any[]
    customers?: any[]
    aov?: any[]
  }
  variant?: 'detailed' | 'enhanced'
}

const KPIGrid: React.FC<KPIGridProps> = ({
  currentKpis,
  previousKpis,
  detailedData,
  variant = 'enhanced'
}) => {
  const kpiConfig = [
    {
      title: 'Total Revenue',
      value: currentKpis?.totalRevenue || 0,
      previousValue: previousKpis?.totalRevenue,
      icon: <DollarSign className="w-5 h-5" />,
      isMonetary: true,
      kpiType: 'revenue' as const,
      detailedData: detailedData?.revenue || [],
      filename: 'total-revenue'
    },
    {
      title: 'Total Orders',
      value: currentKpis?.totalOrders || 0,
      previousValue: previousKpis?.totalOrders,
      icon: <ShoppingCart className="w-5 h-5" />,
      isMonetary: false,
      kpiType: 'orders' as const,
      detailedData: detailedData?.orders || [],
      filename: 'total-orders'
    },
    {
      title: 'New Customers',
      value: currentKpis?.newCustomers || 0,
      previousValue: previousKpis?.newCustomers,
      icon: <Users className="w-5 h-5" />,
      isMonetary: false,
      kpiType: 'customers' as const,
      detailedData: detailedData?.customers || [],
      filename: 'new-customers'
    },
    {
      title: 'Average Order Value',
      value: currentKpis?.avgOrderValue || 0,
      previousValue: previousKpis?.avgOrderValue,
      icon: <Target className="w-5 h-5" />,
      isMonetary: true,
      kpiType: 'aov' as const,
      detailedData: detailedData?.aov || [],
      filename: 'average-order-value'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpiConfig.map((kpi) => {
        if (variant === 'detailed') {
          return (
            <DetailedKPICard
              key={kpi.title}
              title={kpi.title}
              value={kpi.value}
              previousValue={kpi.previousValue}
              icon={kpi.icon}
              isMonetary={kpi.isMonetary}
              kpiType={kpi.kpiType}
              detailedData={kpi.detailedData}
              filename={kpi.filename}
            />
          )
        }

        return (
          <EnhancedKPICard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            previousValue={kpi.previousValue}
            icon={kpi.icon}
            isMonetary={kpi.isMonetary}
          />
        )
      })}
    </div>
  )
}

export default KPIGrid