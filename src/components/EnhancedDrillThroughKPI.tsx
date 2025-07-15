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
    const drillData = await generateDrillThroughData(data, detailedData);
    setDrillThroughData(drillData);
    setShowDrillThrough(true);
  };

  const generateDrillThroughData = async (kpiData: KPIData, detailed: any) => {
    const baseData = {
      title: kpiData.title,
      value: kpiData.value,
      change: kpiData.change,
      changeType: kpiData.changeType,
      timeSeriesData: detailed?.timeSeries || generateMockTimeSeries(),
      topItems: detailed?.topItems || [],
      breakdown: detailed?.breakdown || [],
    };

    // Generate AI insights and recommendations
    try {
      const aiResponse = await fetch('/api/ai-drill-through', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kpiType: kpiData.title,
          currentValue: kpiData.value,
          change: kpiData.change,
          changeType: kpiData.changeType,
          timeSeriesData: baseData.timeSeriesData,
          topItems: baseData.topItems,
          dateRange: dateRange,
          currency: 'GBP'
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        return {
          ...baseData,
          insights: aiData.insights || [],
          recommendations: aiData.recommendations || [],
          explanation: getKPIExplanation(kpiData.title)
        };
      }
    } catch (error) {
      console.error('Failed to generate AI insights for drill-through:', error);
    }

    // Fallback to basic structure if AI fails
    return {
      ...baseData,
      insights: [
        { type: 'neutral', message: 'AI analysis is temporarily unavailable for detailed insights.', impact: 'low' }
      ],
      recommendations: [
        { priority: 'medium', action: 'Monitor this metric and compare with historical trends', impact: 'Helps identify patterns and opportunities' }
      ],
      explanation: getKPIExplanation(kpiData.title)
    };
  };

  const getKPIExplanation = (kpiTitle: string) => {
    switch (kpiTitle.toLowerCase()) {
      case 'total revenue':
        return {
          calculation: 'Total Revenue = Sum of all completed orders within the selected time period',
          factors: ['Order value', 'Number of transactions', 'Refunds and returns', 'Payment processing fees'],
          interpretation: 'Higher revenue indicates better business performance, but should be analyzed alongside profit margins and customer acquisition costs.'
        };
      case 'total orders':
        return {
          calculation: 'Total Orders = Count of all completed orders within the selected time period',
          factors: ['Website traffic', 'Conversion rate', 'Marketing campaigns', 'Seasonal trends'],
          interpretation: 'More orders generally indicate business growth, but should be balanced with average order value and customer satisfaction.'
        };
      case 'average order value':
        return {
          calculation: 'AOV = Total Revenue ÷ Total Number of Orders',
          factors: ['Product pricing', 'Upselling effectiveness', 'Customer purchasing behavior', 'Promotional strategies'],
          interpretation: 'Higher AOV means customers are spending more per transaction, which improves profitability and customer lifetime value.'
        };
      case 'conversion rate':
        return {
          calculation: 'Conversion Rate = (Number of Orders ÷ Number of Visitors) × 100',
          factors: ['Website usability', 'Product appeal', 'Pricing competitiveness', 'Trust signals'],
          interpretation: 'Higher conversion rates indicate that more visitors are becoming customers, which improves marketing ROI and business efficiency.'
        };
      default:
        return {
          calculation: 'Calculation method varies based on the specific metric',
          factors: ['Multiple factors contribute to this metric'],
          interpretation: 'Monitor trends and compare with industry benchmarks for best results.'
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
      // Check if this is a monetary KPI
      const isMonetary = data.title.toLowerCase().includes('revenue') || 
                        data.title.toLowerCase().includes('value') ||
                        data.title.toLowerCase().includes('aov') ||
                        data.title.toLowerCase().includes('average order');
      
      if (isMonetary) {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
        return `$${value.toFixed(0)}`;
      } else {
        // Format as regular number for non-monetary values
        return new Intl.NumberFormat('en-US').format(Math.round(value));
      }
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