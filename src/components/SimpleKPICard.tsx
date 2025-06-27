import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SimpleKPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative';
  icon: React.ReactNode;
  size?: 'small' | 'normal';
}

const SimpleKPICard: React.FC<SimpleKPICardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
  size = 'normal'
}) => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <motion.div variants={fadeInUp}>
      <Card className="transition-all duration-200">
        <CardContent className={size === 'small' ? 'p-4' : 'p-6'}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className={`font-medium text-muted-foreground ${size === 'small' ? 'text-xs' : 'text-sm'}`}>{title}</p>
              </div>
              <div className={size === 'small' ? 'space-y-1' : 'space-y-2'}>
                <p className={`font-bold tracking-tight ${size === 'small' ? 'text-xl' : 'text-3xl'}`}>{value}</p>
                {change && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full font-medium ${
                    size === 'small' ? 'text-xs' : 'text-xs'
                  } ${
                    changeType === 'positive' 
                      ? 'bg-green-50 dark:bg-green-950 text-green-600' 
                      : 'bg-red-50 dark:bg-red-950 text-red-600'
                  }`}>
                    {changeType === 'positive' ? (
                      <ArrowUpRight className={size === 'small' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                    ) : (
                      <ArrowDownRight className={size === 'small' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                    )}
                    <span>{change}</span>
                  </div>
                )}
              </div>
            </div>
            <div className={`bg-primary/10 rounded-xl flex items-center justify-center ${
              size === 'small' ? 'w-10 h-10' : 'w-14 h-14'
            }`}>
              <div className="text-primary">
                {React.cloneElement(icon as React.ReactElement, {
                  className: size === 'small' ? 'w-4 h-4' : 'w-5 h-5'
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SimpleKPICard;