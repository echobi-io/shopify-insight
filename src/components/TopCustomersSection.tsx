import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TopCustomer } from '@/lib/fetchers/getTopCustomersData';
import { formatCurrency } from '@/lib/utils/currencyUtils';

interface TopCustomersSectionProps {
  customers: TopCustomer[];
  isLoading: boolean;
  currency: string;
  showCount?: number;
  loadCount?: number;
}

export const TopCustomersSection: React.FC<TopCustomersSectionProps> = ({
  customers,
  isLoading,
  currency,
  showCount = 5,
  loadCount = 10
}) => {
  const [showAll, setShowAll] = useState(false);
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No customer data available for the selected period
          </p>
        </CardContent>
      </Card>
    );
  }

  const displayCustomers = showAll ? customers.slice(0, loadCount) : customers.slice(0, showCount);
  const hasMore = customers.length > showCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Customers</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {displayCustomers.map((customer, index) => (
            <div
              key={customer.customer_id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {index + 1}
                    </span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {customer.customer_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {customer.customer_email}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {customer.order_count} orders
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      AOV: {formatCurrency(customer.avg_order_value, currency)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(customer.total_spent, currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last: {new Date(customer.last_order_date).toLocaleDateString()}
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
                  Show 5 More
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};