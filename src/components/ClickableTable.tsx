import React from 'react';
import { motion } from 'framer-motion';
import { MousePointer, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ClickableTableProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onExport?: () => void;
  className?: string;
}

const ClickableTable: React.FC<ClickableTableProps> = ({
  title,
  subtitle,
  icon,
  children,
  onExport,
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
      <Card className="hover:border-primary/50 transition-all duration-200 relative overflow-hidden">
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
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="relative">
            {children}
            
            {/* Hover hint for clickable rows */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                <MousePointer className="w-3 h-3" />
                Click rows for details
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ClickableTable;