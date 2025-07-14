import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, MoreHorizontal, Info } from 'lucide-react';
import { DrillThroughModal } from './DrillThroughModal';
import { useDataFetcher } from '@/hooks/useDataFetcher';
import { getDetailedKPIData } from '@/lib/fetchers/getDetailedKPIData';

interface KPIData {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: React.ReactNode;
  color?: string;
  description?: string;
}

interface EnhancedDrillThroughKPIProps {
  data: KPIData;
  dateRange: { startDate: string; endDate: string };
  onRefresh?: () => void;
}

export const EnhancedDrillThroughKPI: React.FC<EnhancedDrillThroughKPIProps> = ({
  data,
  dateRange,
  onRefresh
}) => {
  const [showDrillThrough, setShowDrillThrough] = useState(false);
  const [drillThroughData, setDrillThroughData] = useState(null);

  const { 
    data: detailedData, 
    loading: detailedLoading, 
    error: detailedError,
    refetch: refetchDetailed
  } = useDataFetcher(
    () => getDetailedKPIData(data.title, dateRange),
    [data.title, dateRange.startDate, dateRange.endDate],
    { enabled: false } // Only fetch when drill-through is opened
  );

  const handleDrillThrough = async () => {
    if (!detailedData) {
      await refetchDetailed();
    }
    
    // Generate comprehensive drill-through data based on KPI type
    const drillData = generateDrillThroughData(data, detailedData);
    setDrillThroughData(drillData);
    setShowDrillThrough(true);
  };

  const generateDrillThroughData = (kpiData: KPIData, detailed: any) => {
    const baseData = {
      title: kpiData.title,
      value: kpiData.value,
      change: kpiData.change,
      changeType: kpiData.changeType,
    };

    // Customize based on KPI type
    switch (kpiData.title.toLowerCase()) {
      case 'total revenue':
        return {
          ...baseData,
          timeSeriesData: detailed?.revenueTimeSeries || generateMockTimeSeries(),
          topItems: detailed?.topRevenueProducts || [
            { name: 'Product A', value: 15000, percentage: 25, trend: 'up' },
            { name: 'Product B', value: 12000, percentage: 20, trend: 'stable' },
            { name: 'Product C', value: 9000, percentage: 15, trend: 'down' },
          ],
          breakdown: [
            { category: 'Online Sales', value: 35000, color: '#3b82f6' },
            { category: 'In-Store Sales', value: 25000, color: '#10b981' },
            { category: 'Mobile App', value: 15000, color: '#f59e0b' },
          ],
          insights: [
            { type: 'positive', message: 'Revenue growth is accelerating with 15% increase this month', impact: 'high' },
            { type: 'neutral', message: 'Mobile sales are growing faster than other channels', impact: 'medium' },
            { type: 'negative', message: 'In-store sales showing slight decline', impact: 'low' },
          ],
          recommendations: [
            { priority: 'high', action: 'Invest more in mobile marketing', impact: 'Could increase mobile revenue by 20%' },
            { priority: 'medium', action: 'Analyze in-store customer experience', impact: 'May help reverse declining trend' },
          ],
          explanation: {
            calculation: 'Total Revenue = Sum of all completed orders within the selected time period',
            factors: ['Order value', 'Number of transactions', 'Refunds and returns', 'Payment processing fees'],
            interpretation: 'Higher revenue indicates better business performance, but should be analyzed alongside profit margins and customer acquisition costs.'
          }
        };

      case 'total orders':
        return {
          ...baseData,
          timeSeriesData: detailed?.ordersTimeSeries || generateMockTimeSeries(),
          topItems: detailed?.topOrderSources || [
            { name: 'Organic Search', value: 450, percentage: 35, trend: 'up' },
            { name: 'Direct Traffic', value: 320, percentage: 25, trend: 'stable' },
            { name: 'Social Media', value: 280, percentage: 22, trend: 'up' },
          ],
          breakdown: [
            { category: 'New Customers', value: 650, color: '#3b82f6' },
            { category: 'Returning Customers', value: 400, color: '#10b981' },
          ],
          insights: [
            { type: 'positive', message: 'Order volume increased by 12% compared to last month', impact: 'high' },
            { type: 'positive', message: 'New customer acquisition is strong', impact: 'medium' },
            { type: 'neutral', message: 'Average order frequency is stable', impact: 'low' },
          ],
          recommendations: [
            { priority: 'high', action: 'Focus on converting new customers to repeat buyers', impact: 'Could increase customer lifetime value by 30%' },
            { priority: 'medium', action: 'Optimize checkout process to reduce cart abandonment', impact: 'May increase conversion rate by 5-10%' },
          ],
          explanation: {
            calculation: 'Total Orders = Count of all completed orders within the selected time period',
            factors: ['Website traffic', 'Conversion rate', 'Marketing campaigns', 'Seasonal trends'],
            interpretation: 'More orders generally indicate business growth, but should be balanced with average order value and customer satisfaction.'
          }
        };

      case 'average order value':
        return {
          ...baseData,
          timeSeriesData: detailed?.aovTimeSeries || generateMockTimeSeries(),
          topItems: detailed?.highValueProducts || [
            { name: 'Premium Package', value: 299, percentage: 15, trend: 'up' },
            { name: 'Bundle Deal', value: 199, percentage: 25, trend: 'stable' },
            { name: 'Standard Product', value: 99, percentage: 60, trend: 'down' },
          ],
          breakdown: [
            { category: '$0-$50', value: 200, color: '#ef4444' },
            { category: '$51-$100', value: 350, color: '#f59e0b' },
            { category: '$101-$200', value: 280, color: '#10b981' },
            { category: '$200+', value: 120, color: '#3b82f6' },
          ],
          insights: [
            { type: 'positive', message: 'AOV increased by 8% due to successful upselling campaigns', impact: 'high' },
            { type: 'neutral', message: 'Premium products are gaining traction', impact: 'medium' },
            { type: 'negative', message: 'Too many low-value orders may indicate pricing issues', impact: 'medium' },
          ],
          recommendations: [
            { priority: 'high', action: 'Implement cross-selling recommendations', impact: 'Could increase AOV by 15-20%' },
            { priority: 'medium', action: 'Create more bundle offers', impact: 'May encourage higher-value purchases' },
          ],
          explanation: {
            calculation: 'AOV = Total Revenue ÷ Total Number of Orders',
            factors: ['Product pricing', 'Upselling effectiveness', 'Customer purchasing behavior', 'Promotional strategies'],
            interpretation: 'Higher AOV means customers are spending more per transaction, which improves profitability and customer lifetime value.'
          }
        };

      case 'conversion rate':
        return {
          ...baseData,
          timeSeriesData: detailed?.conversionTimeSeries || generateMockTimeSeries(),
          topItems: detailed?.topConvertingPages || [
            { name: 'Product Page A', value: 4.2, percentage: 15, trend: 'up' },
            { name: 'Landing Page B', value: 3.8, percentage: 12, trend: 'stable' },
            { name: 'Category Page C', value: 2.9, percentage: 8, trend: 'down' },
          ],
          breakdown: [
            { category: 'Desktop', value: 3.5, color: '#3b82f6' },
            { category: 'Mobile', value: 2.8, color: '#10b981' },
            { category: 'Tablet', value: 3.1, color: '#f59e0b' },
          ],
          insights: [
            { type: 'positive', message: 'Overall conversion rate improved by 0.3% this month', impact: 'high' },
            { type: 'negative', message: 'Mobile conversion rate is significantly lower than desktop', impact: 'high' },
            { type: 'neutral', message: 'Tablet users show good engagement', impact: 'low' },
          ],
          recommendations: [
            { priority: 'high', action: 'Optimize mobile checkout experience', impact: 'Could increase mobile conversions by 25%' },
            { priority: 'high', action: 'A/B test product page layouts', impact: 'May improve overall conversion rate' },
          ],
          explanation: {
            calculation: 'Conversion Rate = (Number of Orders ÷ Number of Visitors) × 100',
            factors: ['Website usability', 'Product appeal', 'Pricing competitiveness', 'Trust signals'],
            interpretation: 'Higher conversion rates indicate that more visitors are becoming customers, which improves marketing ROI and business efficiency.'
          }
        };

      default:
        return {
          ...baseData,
          timeSeriesData: generateMockTimeSeries(),
          insights: [
            { type: 'neutral', message: 'This metric is performing within expected ranges', impact: 'medium' },
          ],
          explanation: {
            calculation: 'Calculation method varies based on the specific metric',
            factors: ['Multiple factors contribute to this metric'],
            interpretation: 'Monitor trends and compare with industry benchmarks for best results.'
          }
        };
    }
  };

  const generateMockTimeSeries = () => {
    const data = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 1000) + 500,
      });
    }
    return data;
  };

  const formatValue = (value: string | number) => {
    if (typeof value === 'number') {
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
      return `$${value.toFixed(0)}`;
    }
    return value;
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={handleDrillThrough}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            {data.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {data.icon}
            <Button 
              variant="ghost" 
              size="sm" 
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleDrillThrough();
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {formatValue(data.value)}
          </div>
          {data.change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              data.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.changeType === 'increase' ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>
                {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}% from last period
              </span>
            </div>
          )}
          {data.description && (
            <p className="text-xs text-gray-500 mt-1">{data.description}</p>
          )}
          <div className="mt-3 text-xs text-blue-600 flex items-center gap-1">
            <Info className="h-3 w-3" />
            Click for detailed analysis
          </div>
        </CardContent>
      </Card>

      {drillThroughData && (
        <DrillThroughModal
          isOpen={showDrillThrough}
          onClose={() => setShowDrillThrough(false)}
          data={drillThroughData}
          type="kpi"
        />
      )}
    </>
  );
};