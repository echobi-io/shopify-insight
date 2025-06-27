import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SimpleKPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  size?: 'small' | 'normal';
  trend?: number[];
}

const SimpleKPICard: React.FC<SimpleKPICardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
  size = 'normal',
  trend
}) => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  };

  const getTrendIcon = () => {
    if (!changeType) return null;
    
    switch (changeType) {
      case 'positive':
        return <TrendingUp className="w-3 h-3" />;
      case 'negative':
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
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
        <CardContent className="p-3">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <div className="text-muted-foreground">
              {React.cloneElement(icon as React.ReactElement, {
                className: 'w-4 h-4'
              })}
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-lg font-bold tracking-tight text-foreground">
              {value}
            </p>
            
            <div className="flex items-center justify-between">
              {change && (
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                  changeType === 'positive' 
                    ? 'bg-green-50 text-green-600' 
                    : changeType === 'negative'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-gray-50 text-gray-600'
                }`}>
                  {getTrendIcon()}
                  <span>{change}</span>
                </div>
              )}
              
              {renderMiniChart()}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SimpleKPICard;