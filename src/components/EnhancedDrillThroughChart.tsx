import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { MoreHorizontal, TrendingUp, Info } from 'lucide-react';
import { DrillThroughModal } from './DrillThroughModal';

interface ChartData {
  date: string;
  revenue: number;
  orders: number;
  [key: string]: any;
}

interface EnhancedDrillThroughChartProps {
  title: string;
  data: ChartData[];
  type: 'line' | 'bar' | 'area';
  primaryKey: string;
  secondaryKey?: string;
  dateRange: { startDate: string; endDate: string };
}

export const EnhancedDrillThroughChart: React.FC<EnhancedDrillThroughChartProps> = ({
  title,
  data,
  type,
  primaryKey,
  secondaryKey,
  dateRange
}) => {
  const [showDrillThrough, setShowDrillThrough] = useState(false);

  const formatValue = (value: number) => {
    if (primaryKey.toLowerCase().includes('revenue') || primaryKey.toLowerCase().includes('value')) {
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
      return `$${value.toFixed(0)}`;
    }
    return value.toLocaleString();
  };

  const calculateTrend = () => {
    if (data.length < 2) return 0;
    const recent = data.slice(-7).reduce((sum, item) => sum + item[primaryKey], 0) / 7;
    const previous = data.slice(-14, -7).reduce((sum, item) => sum + item[primaryKey], 0) / 7;
    return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
  };

  const generateDrillThroughData = () => {
    const trend = calculateTrend();
    const totalValue = data.reduce((sum, item) => sum + item[primaryKey], 0);
    const avgValue = totalValue / data.length;

    // Find peak and low points
    const sortedData = [...data].sort((a, b) => b[primaryKey] - a[primaryKey]);
    const topDays = sortedData.slice(0, 5).map(item => ({
      name: item.date,
      value: item[primaryKey],
      trend: 'up' as const
    }));

    // Generate insights based on data patterns
    const insights = [];
    if (trend > 10) {
      insights.push({
        type: 'positive' as const,
        message: `Strong upward trend with ${trend.toFixed(1)}% growth in recent period`,
        impact: 'high' as const
      });
    } else if (trend < -10) {
      insights.push({
        type: 'negative' as const,
        message: `Declining trend with ${Math.abs(trend).toFixed(1)}% decrease in recent period`,
        impact: 'high' as const
      });
    } else {
      insights.push({
        type: 'neutral' as const,
        message: `Stable performance with ${Math.abs(trend).toFixed(1)}% change in recent period`,
        impact: 'medium' as const
      });
    }

    // Seasonal analysis
    const weeklyAvg = data.reduce((acc, item, index) => {
      const dayOfWeek = new Date(item.date).getDay();
      if (!acc[dayOfWeek]) acc[dayOfWeek] = { total: 0, count: 0 };
      acc[dayOfWeek].total += item[primaryKey];
      acc[dayOfWeek].count += 1;
      return acc;
    }, {} as Record<number, { total: number; count: number }>);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const bestDay = Object.entries(weeklyAvg).reduce((best, [day, data]) => {
      const avg = data.total / data.count;
      return avg > best.avg ? { day: parseInt(day), avg } : best;
    }, { day: 0, avg: 0 });

    insights.push({
      type: 'neutral' as const,
      message: `${dayNames[bestDay.day]} typically shows the highest performance`,
      impact: 'medium' as const
    });

    // Generate recommendations
    const recommendations = [];
    if (trend < 0) {
      recommendations.push({
        priority: 'high' as const,
        action: 'Investigate factors causing the decline and implement corrective measures',
        impact: 'Could reverse negative trend and restore growth'
      });
    }

    recommendations.push({
      priority: 'medium' as const,
      action: `Focus marketing efforts on ${dayNames[bestDay.day]}s when performance is typically highest`,
      impact: 'May amplify already strong performance days'
    });

    return {
      title: `${title} - Detailed Analysis`,
      value: formatValue(totalValue),
      change: trend,
      changeType: trend >= 0 ? 'increase' as const : 'decrease' as const,
      timeSeriesData: data.map(item => ({
        date: item.date,
        value: item[primaryKey]
      })),
      topItems: topDays,
      insights,
      recommendations,
      breakdown: secondaryKey ? [
        { category: primaryKey, value: totalValue, color: '#3b82f6' },
        { category: secondaryKey, value: data.reduce((sum, item) => sum + item[secondaryKey], 0), color: '#10b981' }
      ] : undefined,
      explanation: {
        calculation: `${title} is calculated by aggregating ${primaryKey} values over the selected time period`,
        factors: ['Time period selection', 'Data quality', 'Business operations', 'External market conditions'],
        interpretation: `This chart shows the trend of ${primaryKey} over time. Look for patterns, seasonal variations, and sudden changes that might indicate opportunities or issues.`
      }
    };
  };

  const handleDrillThrough = () => {
    setShowDrillThrough(true);
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <TrendingUp className="h-4 w-4" />
              {calculateTrend() > 0 ? '+' : ''}{calculateTrend().toFixed(1)}%
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleDrillThrough}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            {type === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={formatValue} />
                <Tooltip 
                  formatter={(value, name) => [formatValue(Number(value)), name]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey={primaryKey} 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
                {secondaryKey && (
                  <Line 
                    type="monotone" 
                    dataKey={secondaryKey} 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                )}
              </LineChart>
            ) : type === 'area' ? (
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={formatValue} />
                <Tooltip 
                  formatter={(value, name) => [formatValue(Number(value)), name]}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey={primaryKey} 
                  stroke="#3b82f6" 
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                {secondaryKey && (
                  <Area 
                    type="monotone" 
                    dataKey={secondaryKey} 
                    stroke="#10b981" 
                    fill="#10b981"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                )}
              </AreaChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={formatValue} />
                <Tooltip formatter={(value) => formatValue(Number(value))} />
                <Bar dataKey={primaryKey} fill="#3b82f6" />
                {secondaryKey && <Bar dataKey={secondaryKey} fill="#10b981" />}
              </BarChart>
            )}
          </ResponsiveContainer>
          <div className="mt-3 text-xs text-blue-600 flex items-center gap-1">
            <Info className="h-3 w-3" />
            Click the menu button for detailed analysis and insights
          </div>
        </CardContent>
      </Card>

      <DrillThroughModal
        isOpen={showDrillThrough}
        onClose={() => setShowDrillThrough(false)}
        data={generateDrillThroughData()}
        type="chart"
      />
    </>
  );
};