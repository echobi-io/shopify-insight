import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/settingsUtils';

interface TopItem {
  id: string;
  name: string;
  primaryValue: number;
  secondaryValue: number;
  primaryLabel: string;
  secondaryLabel: string;
  additionalInfo?: string;
  additionalLabel?: string;
}

interface TopItemsSectionProps {
  title: string;
  description?: string;
  items: TopItem[];
  isLoading: boolean;
  currency?: string;
  showCount?: number;
  loadCount?: number;
  formatPrimaryValue?: (value: number) => string;
  formatSecondaryValue?: (value: number) => string;
}

export const TopItemsSection: React.FC<TopItemsSectionProps> = ({
  title,
  description,
  items,
  isLoading,
  currency = 'GBP',
  showCount = 5,
  loadCount = 10,
  formatPrimaryValue,
  formatSecondaryValue
}) => {
  const [showAll, setShowAll] = useState(false);

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const defaultFormatPrimary = (value: number) => {
    return formatPrimaryValue ? formatPrimaryValue(value) : formatCurrency(value, currency);
  };

  const defaultFormatSecondary = (value: number) => {
    return formatSecondaryValue ? formatSecondaryValue(value) : formatCurrency(value, currency);
  };

  if (isLoading) {
    return (
      <Card className="card-minimal">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-black">{title}</CardTitle>
          {description && (
            <p className="font-light text-gray-600">{description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(showCount)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card className="card-minimal">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-black">{title}</CardTitle>
          {description && (
            <p className="font-light text-gray-600">{description}</p>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8 font-light">
            No data available for the selected period
          </p>
        </CardContent>
      </Card>
    );
  }

  const displayItems = showAll ? items.slice(0, loadCount) : items.slice(0, showCount);
  const hasMore = items.length > showCount;
  
  // Debug logging
  console.log(`${title} - Total items: ${items.length}, Show count: ${showCount}, Has more: ${hasMore}`);

  return (
    <Card className="card-minimal">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-black">{title}</CardTitle>
        {description && (
          <p className="font-light text-gray-600">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayItems.map((item, index) => (
            <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-black">{item.name}</p>
                  <p className="text-sm font-light text-gray-600">
                    {item.secondaryLabel}: {defaultFormatSecondary(item.secondaryValue)}
                  </p>
                  {item.additionalInfo && item.additionalLabel && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      {item.additionalInfo} {item.additionalLabel}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-black">
                  {defaultFormatPrimary(item.primaryValue)}
                </p>
                <p className="text-sm font-light text-gray-600">
                  {item.primaryLabel}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {hasMore && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => setShowAll(!showAll)}
              className="w-full text-sm font-light text-gray-600 hover:text-black hover:bg-gray-50"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Show More ({items.length - showCount} more)
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};