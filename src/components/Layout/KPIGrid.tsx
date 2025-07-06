import React from 'react'
import { DollarSign, ShoppingCart, Target, Users } from 'lucide-react'
import EnhancedKPICard from '@/components/EnhancedKPICard'
import { KPIData } from '@/lib/fetchers/getKpis'

interface KPIGridProps {
  currentKpis: KPIData | null
  previousKpis?: KPIData | null
  variant?: 'simple' | 'enhanced'
}

const KPIGrid: React.FC<KPIGridProps> = ({
  currentKpis,
  previousKpis,
  variant = 'enhanced'
}) => {
  if (!currentKpis) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <EnhancedKPICard
        title="Total Revenue"
        value={currentKpis.totalRevenue || 0}
        previousValue={previousKpis?.totalRevenue}
        icon={<DollarSign className="w-5 h-5" />}
        isMonetary={true}
      />
      <EnhancedKPICard
        title="Total Orders"
        value={currentKpis.totalOrders || 0}
        previousValue={previousKpis?.totalOrders}
        icon={<ShoppingCart className="w-5 h-5" />}
        isMonetary={false}
      />
      <EnhancedKPICard
        title="Average Order Value"
        value={currentKpis.avgOrderValue || 0}
        previousValue={previousKpis?.avgOrderValue}
        icon={<Target className="w-5 h-5" />}
        isMonetary={true}
      />
      <EnhancedKPICard
        title="New Customers"
        value={currentKpis.newCustomers || 0}
        previousValue={previousKpis?.newCustomers}
        icon={<Users className="w-5 h-5" />}
        isMonetary={false}
      />
    </div>
  )
}

export default KPIGrid