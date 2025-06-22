import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, MousePointer } from 'lucide-react';

interface ClickableChartProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
  onChartClick?: (data?: any) => void;
  onDetailsClick?: () => void;
  onExport?: () => void;
  className?: string;
}

const ClickableChart: React.FC<ClickableChartProps> = ({
  title,
  subtitle,
  icon,
  badge,
  children,
  onChartClick,
  onDetailsClick,
  onExport,
  className = ""
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`group ${className}`}
    >
      <Card className="hover:border-primary/50 transition-all duration-200 relative overflow-hidden">
        {/* Hover hint */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <div className="bg-primary/10 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
            <MousePointer className="w-3 h-3 text-primary" />
            <span className="text-xs text-primary font-medium">Click to drill down</span>
          </div>
        </div>

        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon}
              <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                )}
              </div>
              {badge && (
                <Badge variant="secondary" className="ml-2">
                  {badge}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExport();
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              )}
              {onDetailsClick && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDetailsClick();
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Details
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent 
          className={`${onChartClick ? 'cursor-pointer' : ''}`}
          onClick={onChartClick}
        >
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ClickableChart;