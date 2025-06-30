import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/settingsUtils';

interface EnhancedKPICardProps {
  title: string;
  value: number;
  previousValue?: number;
  icon: React.ReactNode;
  isMonetary?: boolean;
  size?: 'small' | 'normal';
  trend?: number[];
}

const EnhancedKPICard: React.FC<EnhancedKPICardProps> = ({
  title,
  value,
  previousValue,
  icon,
  isMonetary = false,
  size = 'normal',
  trend
}) => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  };

  // Calculate variance and percentage change
  const variance = previousValue !== undefined ? value - previousValue : 0;
  const percentageChange = previousValue !== undefined && previousValue !== 0 
    ? ((value - previousValue) / Math.abs(previousValue)) * 100 
    : 0;

  const changeType = variance > 0 ? 'positive' : variance < 0 ? 'negative' : 'neutral';

  const getTrendIcon = () => {
    if (previousValue === undefined) return null;
    
    switch (changeType) {
      case 'positive':
        return <TrendingUp className="w-3 h-3" />;
      case 'negative':
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  const formatValue = (val: number) => {
    if (isMonetary) {
      return formatCurrency(val);
    }
    return new Intl.NumberFormat('en-US').format(val);
  };

  const formatVariance = (val: number) => {
    if (isMonetary) {
      return formatCurrency(Math.abs(val));
    }
    return new Intl.NumberFormat('en-US').format(Math.abs(val));
  };

  const renderMiniChart = () => {
    if (!trend || trend.length === 0) return null;
    
    const max = Math.max(...trend);
    const min = Math.min(...trend);
    const range = max - min || 1;
    
    return (
      <div className="flex items-end space-x-0.5 h-6 w-12">
        {trend.map((value, index) => {
          const height = ((value - min) / range) * 20 + 4;
          return (
            <div
              key={index}
              className={`w-1 rounded-sm ${
                changeType === 'positive' ? 'bg-green-400' :
                changeType === 'negative' ? 'bg-red-400' : 'bg-gray-400'
              }`}
              style={{ height: `${height}px` }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <motion.div variants={fadeInUp}>
      <Card className="transition-all duration-200 hover:shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <div className="text-muted-foreground">
              {React.cloneElement(icon as React.ReactElement, {
                className: 'w-4 h-4'
              })}
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {formatValue(value)}
            </p>
            
            {previousValue !== undefined && (
              <div className="space-y-2">
                {/* Variance from Prior Year */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                  changeType === 'positive' 
                    ? 'bg-green-50 text-green-700' 
                    : changeType === 'negative'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-gray-50 text-gray-700'
                }`}>
                  {getTrendIcon()}
                  <span>
                    {changeType === 'positive' ? '+' : changeType === 'negative' ? '-' : ''}
                    {formatVariance(variance)} vs PY
                  </span>
                </div>
                
                {/* Percentage Change */}
                <div className={`flex items-center justify-between text-xs ${
                  changeType === 'positive' 
                    ? 'text-green-600' 
                    : changeType === 'negative'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}>
                  <span className="font-medium">
                    {changeType === 'positive' ? '+' : changeType === 'negative' ? '-' : ''}
                    {Math.abs(percentageChange).toFixed(1)}%
                  </span>
                  {renderMiniChart()}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EnhancedKPICard;