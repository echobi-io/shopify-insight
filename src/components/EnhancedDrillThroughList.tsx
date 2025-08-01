import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, TrendingUp, TrendingDown, Users, Package, DollarSign, Info } from 'lucide-react';
import { DrillThroughModal } from './DrillThroughModal';

interface ListItem {
  id: string;
  name: string;
  value: number;
  secondaryValue?: number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  metadata?: Record<string, any>;
}

interface EnhancedDrillThroughListProps {
  title: string;
  items: ListItem[];
  type: 'customers' | 'products' | 'orders';
  showMore?: boolean;
  onShowMore?: () => void;
  dateRange: { startDate: string; endDate: string };
}

export const EnhancedDrillThroughList: React.FC<EnhancedDrillThroughListProps> = ({
  title,
  items,
  type,
  showMore = false,
  onShowMore,
  dateRange
}) => {
  const [showDrillThrough, setShowDrillThrough] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);

  const getIcon = () => {
    switch (type) {
      case 'customers': return <Users className="h-4 w-4" />;
      case 'products': return <Package className="h-4 w-4" />;
      case 'orders': return <DollarSign className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const formatValue = (value: number) => {
    if (type === 'customers' || type === 'orders') {
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
      return `$${value.toFixed(0)}`;
    }
    return value.toLocaleString();
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-500" />;
      default: return null;
    }
  };

  const generateItemDrillThroughData = (item: ListItem) => {
    const baseData = {
      title: `${item.name} - Detailed Analysis`,
      value: formatValue(item.value),
      change: item.change,
      changeType: item.change && item.change >= 0 ? 'increase' as const : 'decrease' as const,
    };

    // Generate mock time series data for the item
    const timeSeriesData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        value: item.value * (0.8 + Math.random() * 0.4), // Vary around the base value
      };
    });

    switch (type) {
      case 'customers':
        return {
          ...baseData,
          timeSeriesData,
          topItems: [
            { name: 'Total Orders', value: item.metadata?.orderCount || 12, trend: 'up' as const },
            { name: 'Avg Order Value', value: item.value / (item.metadata?.orderCount || 12), trend: 'stable' as const },
            { name: 'Last Order', value: 5, trend: 'neutral' as const }, // days ago
          ],
          breakdown: [
            { category: 'Product A', value: item.value * 0.4, color: '#3b82f6' },
            { category: 'Product B', value: item.value * 0.3, color: '#10b981' },
            { category: 'Product C', value: item.value * 0.2, color: '#f59e0b' },
            { category: 'Others', value: item.value * 0.1, color: '#ef4444' },
          ],
          insights: [
            { 
              type: 'positive' as const, 
              message: `${item.name} is a high-value customer with consistent purchase behavior`, 
              impact: 'high' as const 
            },
            { 
              type: 'neutral' as const, 
              message: 'Customer shows preference for premium products', 
              impact: 'medium' as const 
            },
          ],
          recommendations: [
            { 
              priority: 'high' as const, 
              action: 'Send personalized product recommendations based on purchase history', 
              impact: 'Could increase customer lifetime value by 15-25%' 
            },
            { 
              priority: 'medium' as const, 
              action: 'Invite to VIP customer program', 
              impact: 'May improve retention and increase purchase frequency' 
            },
          ],
          explanation: {
            calculation: 'Customer value is calculated as the total revenue generated by this customer over the selected time period',
            factors: ['Purchase frequency', 'Average order value', 'Product preferences', 'Seasonal patterns'],
            interpretation: 'High-value customers like this one are crucial for business growth and should receive personalized attention and offers.'
          }
        };

      case 'products':
        return {
          ...baseData,
          timeSeriesData,
          topItems: [
            { name: 'Units Sold', value: item.metadata?.unitsSold || 156, trend: 'up' as const },
            { name: 'Revenue per Unit', value: item.value / (item.metadata?.unitsSold || 156), trend: 'stable' as const },
            { name: 'Return Rate', value: 2.3, trend: 'down' as const }, // percentage
          ],
          breakdown: [
            { category: 'Online Sales', value: item.value * 0.6, color: '#3b82f6' },
            { category: 'In-Store Sales', value: item.value * 0.3, color: '#10b981' },
            { category: 'Mobile App', value: item.value * 0.1, color: '#f59e0b' },
          ],
          insights: [
            { 
              type: 'positive' as const, 
              message: `${item.name} is a top-performing product with strong sales momentum`, 
              impact: 'high' as const 
            },
            { 
              type: 'neutral' as const, 
              message: 'Product performs well across all sales channels', 
              impact: 'medium' as const 
            },
          ],
          recommendations: [
            { 
              priority: 'high' as const, 
              action: 'Increase inventory levels to meet growing demand', 
              impact: 'Prevents stockouts and maintains sales momentum' 
            },
            { 
              priority: 'medium' as const, 
              action: 'Create bundle offers with complementary products', 
              impact: 'Could increase average order value by 20%' 
            },
          ],
          explanation: {
            calculation: 'Product revenue is the total sales value for this product over the selected time period',
            factors: ['Unit price', 'Sales volume', 'Promotional activities', 'Market demand'],
            interpretation: 'Top-performing products like this one drive significant revenue and should be prioritized in marketing and inventory planning.'
          }
        };

      default:
        return {
          ...baseData,
          timeSeriesData,
          insights: [
            { type: 'neutral' as const, message: 'This item is performing within expected ranges', impact: 'medium' as const },
          ],
          explanation: {
            calculation: 'Value is calculated based on the specific metrics for this item type',
            factors: ['Various factors contribute to this metric'],
            interpretation: 'Monitor trends and compare with similar items for best insights.'
          }
        };
    }
  };

  const generateOverallDrillThroughData = () => {
    const totalValue = items.reduce((sum, item) => sum + item.value, 0);
    const avgValue = totalValue / items.length;

    return {
      title: `${title} - Overall Analysis`,
      value: formatValue(totalValue),
      change: items.reduce((sum, item) => sum + (item.change || 0), 0) / items.length,
      changeType: 'increase' as const,
      timeSeriesData: Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          value: totalValue * (0.8 + Math.random() * 0.4),
        };
      }),
      topItems: items.slice(0, 10).map(item => ({
        name: item.name,
        value: item.value,
        percentage: (item.value / totalValue) * 100,
        trend: item.trend || 'stable' as const
      })),
      breakdown: items.slice(0, 5).map((item, index) => ({
        category: item.name,
        value: item.value,
        color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index]
      })),
      insights: [
        { 
          type: 'positive' as const, 
          message: `Top ${type} are contributing significantly to overall performance`, 
          impact: 'high' as const 
        },
        { 
          type: 'neutral' as const, 
          message: `Performance distribution shows healthy diversity across ${type}`, 
          impact: 'medium' as const 
        },
      ],
      recommendations: [
        { 
          priority: 'high' as const, 
          action: `Focus on nurturing relationships with top-performing ${type}`, 
          impact: 'Could amplify already strong performance' 
        },
        { 
          priority: 'medium' as const, 
          action: `Analyze patterns from top ${type} to improve others`, 
          impact: 'May lift overall performance across the board' 
        },
      ],
      explanation: {
        calculation: `Total value represents the sum of all ${type} performance over the selected period`,
        factors: ['Individual performance', 'Market conditions', 'Business strategies', 'Seasonal trends'],
        interpretation: `This analysis helps identify top performers and opportunities for improvement across all ${type}.`
      }
    };
  };

  const handleItemClick = (item: ListItem) => {
    setSelectedItem(item);
    setShowDrillThrough(true);
  };

  const handleOverallDrillThrough = () => {
    setSelectedItem(null);
    setShowDrillThrough(true);
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {getIcon()}
            {title}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleOverallDrillThrough}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div 
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => handleItemClick(item)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{item.name}</div>
                    {item.secondaryValue && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.secondaryValue.toLocaleString()} {type === 'customers' ? 'orders' : 'units'}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <div className="font-semibold text-sm tabular-nums">{formatValue(item.value)}</div>
                    {item.change !== undefined && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}%
                      </div>
                    )}
                  </div>
                  {item.trend && (
                    <div className="flex-shrink-0">
                      {getTrendIcon(item.trend)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {showMore && onShowMore && (
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={onShowMore}
            >
              Show More
            </Button>
          )}

          <div className="mt-3 text-xs text-blue-600 flex items-center gap-1">
            <Info className="h-3 w-3" />
            Click on any item or the menu button for detailed analysis
          </div>
        </CardContent>
      </Card>

      <DrillThroughModal
        isOpen={showDrillThrough}
        onClose={() => setShowDrillThrough(false)}
        data={selectedItem ? generateItemDrillThroughData(selectedItem) : generateOverallDrillThroughData()}
        type="list"
      />
    </>
  );
};