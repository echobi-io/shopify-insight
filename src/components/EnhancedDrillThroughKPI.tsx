import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, MoreHorizontal, Info } from 'lucide-react';
import { DrillThroughModal } from './DrillThroughModal';
import { useDataFetcher } from '@/hooks/useDataFetcher';
import { getDetailedKPIData } from '@/lib/fetchers/getDetailedKPIData';
import { safePercentage, safeNumber, formatNumber, formatCompactNumber } from '@/lib/utils/numberUtils';
import { formatCurrency } from '@/lib/utils/currencyUtils';

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
  const [isLoadingDrillThrough, setIsLoadingDrillThrough] = useState(false);

  const { 
    data: detailedData, 
    loading: detailedLoading, 
    error: detailedError,
    refetch: refetchDetailed
  } = useDataFetcher(
    () => getDetailedKPIData(data.title, dateRange),
    { enabled: false } // Only fetch when drill-through is opened
  );

  const handleDrillThrough = async () => {
    setIsLoadingDrillThrough(true);
    setShowDrillThrough(true);
    
    try {
      // Generate basic drill-through data immediately
      const basicDrillData = generateBasicDrillThroughData(data);
      setDrillThroughData(basicDrillData);
      
      // Fetch detailed data in background
      let detailed = detailedData;
      if (!detailed) {
        detailed = await refetchDetailed();
      }
      
      // Generate enhanced drill-through data
      const enhancedDrillData = await generateDrillThroughData(data, detailed);
      setDrillThroughData(enhancedDrillData);
    } catch (error) {
      console.error('Error generating drill-through data:', error);
      // Fallback to basic data
      const basicDrillData = generateBasicDrillThroughData(data);
      setDrillThroughData(basicDrillData);
    } finally {
      setIsLoadingDrillThrough(false);
    }
  };

  const generateBasicDrillThroughData = (kpiData: KPIData) => {
    return {
      title: kpiData.title,
      value: kpiData.value,
      change: kpiData.change,
      changeType: kpiData.changeType,
      timeSeriesData: generateMockTimeSeries(),
      topItems: [],
      breakdown: [],
      insights: [
        { type: 'neutral', message: 'Loading detailed insights...', impact: 'low' }
      ],
      recommendations: [
        { priority: 'medium', action: 'Loading recommendations...', impact: 'Loading analysis...' }
      ],
      explanation: getKPIExplanation(kpiData.title)
    };
  };

  const generateDrillThroughData = async (kpiData: KPIData, detailed: any) => {
    // Process detailed data to create meaningful insights
    const processedData = processDetailedData(kpiData, detailed);
    
    const baseData = {
      title: kpiData.title,
      value: kpiData.value,
      change: kpiData.change,
      changeType: kpiData.changeType,
      timeSeriesData: processedData.timeSeriesData,
      topItems: processedData.topItems,
      breakdown: processedData.breakdown,
    };

    // Generate static insights based on data patterns (faster than AI)
    const staticInsights = generateStaticInsights(kpiData, processedData);
    const staticRecommendations = generateStaticRecommendations(kpiData, processedData);

    // Try AI enhancement but don't block on it
    let aiInsights = staticInsights;
    let aiRecommendations = staticRecommendations;
    
    try {
      const aiResponse = await Promise.race([
        fetch('/api/ai-drill-through', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kpiType: kpiData.title,
            currentValue: kpiData.value,
            change: kpiData.change,
            changeType: kpiData.changeType,
            timeSeriesData: baseData.timeSeriesData,
            topItems: baseData.topItems,
            dateRange: dateRange,
            currency: undefined // Will use settings currency
          }),
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 3000))
      ]);

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        aiInsights = aiData.insights || staticInsights;
        aiRecommendations = aiData.recommendations || staticRecommendations;
      }
    } catch (error) {
      console.log('Using static insights due to AI unavailability:', error.message);
    }

    return {
      ...baseData,
      insights: aiInsights,
      recommendations: aiRecommendations,
      explanation: getKPIExplanation(kpiData.title)
    };
  };

  const processDetailedData = (kpiData: KPIData, detailed: any) => {
    const kpiType = kpiData.title.toLowerCase();
    
    // Process time series data
    let timeSeriesData = [];
    if (detailed?.revenueTimeSeries && kpiType.includes('revenue')) {
      timeSeriesData = detailed.revenueTimeSeries;
    } else if (detailed?.ordersTimeSeries && kpiType.includes('order')) {
      timeSeriesData = detailed.ordersTimeSeries;
    } else if (detailed?.aovTimeSeries && kpiType.includes('average')) {
      timeSeriesData = detailed.aovTimeSeries;
    } else {
      timeSeriesData = generateMockTimeSeries();
    }

    // Process top items
    let topItems = [];
    if (detailed?.topRevenueProducts && kpiType.includes('revenue')) {
      topItems = detailed.topRevenueProducts;
    } else if (detailed?.topOrderSources && kpiType.includes('order')) {
      topItems = detailed.topOrderSources;
    } else if (detailed?.highValueProducts && kpiType.includes('average')) {
      topItems = detailed.highValueProducts;
    }

    // Generate breakdown data
    const breakdown = generateBreakdownData(kpiData, detailed);

    return { timeSeriesData, topItems, breakdown };
  };

  const generateBreakdownData = (kpiData: KPIData, detailed: any) => {
    const kpiType = kpiData.title.toLowerCase();
    
    if (kpiType.includes('revenue')) {
      return [
        { category: 'Product Sales', value: Number(kpiData.value) * 0.85, color: '#3b82f6' },
        { category: 'Shipping', value: Number(kpiData.value) * 0.10, color: '#10b981' },
        { category: 'Other', value: Number(kpiData.value) * 0.05, color: '#f59e0b' }
      ];
    } else if (kpiType.includes('order')) {
      return [
        { category: 'New Customers', value: Number(kpiData.value) * 0.6, color: '#3b82f6' },
        { category: 'Returning Customers', value: Number(kpiData.value) * 0.4, color: '#10b981' }
      ];
    }
    
    return [];
  };

  const generateStaticInsights = (kpiData: KPIData, processedData: any) => {
    const insights = [];
    const change = kpiData.change || 0;
    const kpiType = kpiData.title.toLowerCase();

    if (Math.abs(change) > 20) {
      insights.push({
        type: change > 0 ? 'positive' : 'negative',
        message: `${kpiData.title} has ${change > 0 ? 'increased' : 'decreased'} significantly by ${Math.abs(change).toFixed(1)}% compared to the previous period.`,
        impact: 'high'
      });
    } else if (Math.abs(change) > 5) {
      insights.push({
        type: change > 0 ? 'positive' : 'negative',
        message: `${kpiData.title} shows a ${change > 0 ? 'positive' : 'negative'} trend with a ${Math.abs(change).toFixed(1)}% change.`,
        impact: 'medium'
      });
    } else {
      insights.push({
        type: 'neutral',
        message: `${kpiData.title} remains relatively stable with minimal change from the previous period.`,
        impact: 'low'
      });
    }

    // Add trend-specific insights
    if (processedData.timeSeriesData && processedData.timeSeriesData.length > 0) {
      const recent = processedData.timeSeriesData.slice(-7);
      const earlier = processedData.timeSeriesData.slice(-14, -7);
      
      if (recent.length > 0 && earlier.length > 0) {
        const recentAvg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
        const earlierAvg = earlier.reduce((sum, d) => sum + d.value, 0) / earlier.length;
        const weeklyChange = ((recentAvg - earlierAvg) / earlierAvg) * 100;
        
        if (Math.abs(weeklyChange) > 10) {
          insights.push({
            type: weeklyChange > 0 ? 'positive' : 'negative',
            message: `Recent 7-day performance shows a ${weeklyChange > 0 ? 'strong upward' : 'concerning downward'} trend of ${Math.abs(weeklyChange).toFixed(1)}%.`,
            impact: 'medium'
          });
        }
      }
    }

    return insights;
  };

  const generateStaticRecommendations = (kpiData: KPIData, processedData: any) => {
    const recommendations = [];
    const change = kpiData.change || 0;
    const kpiType = kpiData.title.toLowerCase();

    if (kpiType.includes('revenue')) {
      if (change < -10) {
        recommendations.push({
          priority: 'high',
          action: 'Investigate revenue decline and implement recovery strategies',
          impact: 'Focus on customer retention, pricing optimization, and marketing campaigns to reverse the downward trend.'
        });
      } else if (change > 15) {
        recommendations.push({
          priority: 'medium',
          action: 'Capitalize on revenue growth momentum',
          impact: 'Scale successful strategies, increase inventory, and expand marketing to sustain growth.'
        });
      } else {
        recommendations.push({
          priority: 'low',
          action: 'Monitor revenue trends and optimize conversion funnel',
          impact: 'Maintain current performance while identifying opportunities for incremental improvements.'
        });
      }
    } else if (kpiType.includes('order')) {
      if (change < -15) {
        recommendations.push({
          priority: 'high',
          action: 'Address order volume decline immediately',
          impact: 'Review website performance, marketing effectiveness, and customer experience to restore order flow.'
        });
      } else {
        recommendations.push({
          priority: 'medium',
          action: 'Optimize order conversion and customer acquisition',
          impact: 'Improve website UX, implement retargeting campaigns, and enhance product recommendations.'
        });
      }
    } else if (kpiType.includes('average') || kpiType.includes('aov')) {
      recommendations.push({
        priority: 'medium',
        action: 'Implement upselling and cross-selling strategies',
        impact: 'Increase average order value through product bundling, recommendations, and strategic pricing.'
      });
    }

    // Add general monitoring recommendation
    recommendations.push({
      priority: 'low',
      action: 'Set up automated alerts for significant changes',
      impact: 'Enable proactive monitoring to catch trends early and respond quickly to performance changes.'
    });

    return recommendations;
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
        return formatCurrency(value);
      } else {
        // Format as regular number for non-monetary values
        return formatNumber(value);
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
                {safePercentage(data.change)} from last period
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