import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, Download, MousePointer, TrendingUp } from 'lucide-react';

interface ComparisonRow {
  metric: string;
  thisMonth: string;
  lastMonth: string;
  deltaPercent: number;
  yoyPercent?: number;
  trend: 'up' | 'down';
}

interface ClickableComparisonProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  data: ComparisonRow[];
  onDeltaClick?: (metric: string, period: 'month' | 'year') => void;
  onExport?: () => void;
  className?: string;
}

const ClickableComparison: React.FC<ClickableComparisonProps> = ({
  title,
  subtitle,
  icon,
  badge,
  data,
  onDeltaClick,
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
            <span className="text-xs text-primary font-medium">Click deltas for analysis</span>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Metric</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">This Month</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Last Month</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">M/M Change</th>
                  {data.some(row => row.yoyPercent !== undefined) && (
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Y/Y Change</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="py-3 px-4 font-medium">{row.metric}</td>
                    <td className="text-right py-3 px-4">{row.thisMonth}</td>
                    <td className="text-right py-3 px-4 text-muted-foreground">{row.lastMonth}</td>
                    <td className="text-right py-3 px-4">
                      <button
                        onClick={() => onDeltaClick?.(row.metric, 'month')}
                        className={`flex items-center justify-end gap-1 hover:bg-muted/50 rounded px-2 py-1 transition-colors ${
                          row.deltaPercent > 0 ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        {row.deltaPercent > 0 ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                        <span className="font-medium">{Math.abs(row.deltaPercent).toFixed(1)}%</span>
                      </button>
                    </td>
                    {row.yoyPercent !== undefined && (
                      <td className="text-right py-3 px-4">
                        <button
                          onClick={() => onDeltaClick?.(row.metric, 'year')}
                          className={`flex items-center justify-end gap-1 hover:bg-muted/50 rounded px-2 py-1 transition-colors ${
                            row.yoyPercent > 0 ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          {row.yoyPercent > 0 ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                          <span className="font-medium">{Math.abs(row.yoyPercent).toFixed(1)}%</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ClickableComparison;