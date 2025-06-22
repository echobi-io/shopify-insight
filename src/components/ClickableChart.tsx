import React from 'react';
import { motion } from 'framer-motion';
import { MousePointer, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ClickableChartProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onChartClick?: (data?: any) => void;
  onDetailsClick?: () => void;
  className?: string;
}

const ClickableChart: React.FC<ClickableChartProps> = ({
  title,
  subtitle,
  icon,
  children,
  onChartClick,
  onDetailsClick,
  className = ""
}) => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <motion.div 
      variants={fadeInUp} 
      className={`group ${className}`}
    >
      <Card className="hover:border-primary/50 transition-all duration-200 relative overflow-hidden hover:shadow-md">
        {/* Hover indicator */}
        {onChartClick && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <MousePointer className="w-4 h-4 text-primary" />
          </div>
        )}
        
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {icon}
              <div>
                {title}
                {subtitle && (
                  <p className="text-sm text-muted-foreground font-normal mt-1">{subtitle}</p>
                )}
              </div>
            </CardTitle>
            <div className="flex items-center gap-2">
              {onDetailsClick && (
                <Button variant="outline" size="sm" onClick={onDetailsClick}>
                  <Eye className="w-4 h-4 mr-2" />
                  Details
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent 
          className={onChartClick ? "cursor-pointer" : ""}
          onClick={onChartClick}
        >
          {children}
        </CardContent>
        
        {/* Click hint overlay */}
        {onChartClick && (
          <>
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            {/* Bottom hint */}
            <div className="absolute bottom-4 left-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <p className="text-xs text-primary font-medium">Click chart for detailed breakdown →</p>
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
};

export default ClickableChart;