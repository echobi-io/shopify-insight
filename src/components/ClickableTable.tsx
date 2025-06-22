import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, MousePointer, Filter } from 'lucide-react';

interface ClickableTableProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
  onExport?: () => void;
  onFilter?: () => void;
  className?: string;
  showHoverHint?: boolean;
}

const ClickableTable: React.FC<ClickableTableProps> = ({
  title,
  subtitle,
  icon,
  badge,
  children,
  onExport,
  onFilter,
  className = "",
  showHoverHint = true
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
        {showHoverHint && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <div className="bg-primary/10 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
              <MousePointer className="w-3 h-3 text-primary" />
              <span className="text-xs text-primary font-medium">Click rows for details</span>
            </div>
          </div>
        )}

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
              {onFilter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilter();
                  }}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              )}
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
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ClickableTable;