import React from 'react'
import { DollarSign, ShoppingCart, Target, Users } from 'lucide-react'
import EnhancedKPICard from '@/components/EnhancedKPICard'
import { KPIData } from '@/lib/fetchers/getKpisOptimized'

interface DetailedData {
  revenue?: any[]
  orders?: any[]
  customers?: any[]
  aov?: any[]
}

interface KPIGridProps {
  currentKpis: KPIData | null
  previousKpis?: KPIData | null
  variant?: 'simple' | 'enhanced' | 'detailed'
  detailedData?: DetailedData
}

const KPIGrid: React.FC<KPIGridProps> = ({
  currentKpis,
  previousKpis,
  variant = 'enhanced',
  detailedData
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
        data={detailedData?.revenue}
        filename="total-revenue"
      />
      <EnhancedKPICard
        title="Total Orders"
        value={currentKpis.totalOrders || 0}
        previousValue={previousKpis?.totalOrders}
        icon={<ShoppingCart className="w-5 h-5" />}
        isMonetary={false}
        data={detailedData?.orders}
        filename="total-orders"
      />
      <EnhancedKPICard
        title="Average Order Value"
        value={currentKpis.avgOrderValue || 0}
        previousValue={previousKpis?.avgOrderValue}
        icon={<Target className="w-5 h-5" />}
        isMonetary={true}
        data={detailedData?.aov}
        filename="average-order-value"
      />
      <EnhancedKPICard
        title="New Customers"
        value={currentKpis.newCustomers || 0}
        previousValue={previousKpis?.newCustomers}
        icon={<Users className="w-5 h-5" />}
        isMonetary={false}
        data={detailedData?.customers}
        filename="new-customers"
      />
    </div>
  )
}

export default KPIGrid