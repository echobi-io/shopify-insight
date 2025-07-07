import React, { useState, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus, Maximize2, Download, FileText, Image, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/utils/settingsUtils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface EnhancedKPICardProps {
  title: string;
  value: number;
  previousValue?: number;
  icon: React.ReactNode;
  isMonetary?: boolean;
  size?: 'small' | 'normal';
  trend?: number[];
  data?: any[];
  filename?: string;
}

const EnhancedKPICard: React.FC<EnhancedKPICardProps> = ({
  title,
  value,
  previousValue,
  icon,
  isMonetary = false,
  size = 'normal',
  trend,
  data = [],
  filename
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);



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

  const downloadCSV = () => {
    if (!data || data.length === 0) {
      // Create basic CSV with KPI data
      const csvData = [
        { metric: title, current_value: value, previous_value: previousValue || 0, variance, percentage_change: percentageChange }
      ];
      
      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename || title.toLowerCase().replace(/\s+/g, '-')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    try {
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename || title.toLowerCase().replace(/\s+/g, '-')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };

  const downloadPNG = async () => {
    if (!contentRef.current) return;

    try {
      setIsDownloading(true);
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `${filename || title.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error downloading PNG:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadPDF = async () => {
    if (!contentRef.current) return;

    try {
      setIsDownloading(true);
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${filename || title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setIsDownloading(false);
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

  const renderExpandedContent = () => {
    // Determine KPI type for specialized content
    const kpiType = title.toLowerCase().includes('revenue') ? 'revenue' :
                   title.toLowerCase().includes('order') ? 'orders' :
                   title.toLowerCase().includes('customer') ? 'customers' :
                   title.toLowerCase().includes('average') || title.toLowerCase().includes('aov') ? 'aov' : 'general';

    return (
      <div className="space-y-6">
        {/* Main KPI Display */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            {React.cloneElement(icon as React.ReactElement, {
              className: 'w-12 h-12 text-primary'
            })}
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-2">
            {formatValue(value)}
          </h2>
          <p className="text-lg text-muted-foreground">{title}</p>
        </div>

        {/* Comparison with Previous Period */}
        {previousValue !== undefined && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Current Period</p>
              <p className="text-xl font-semibold">{formatValue(value)}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Previous Period</p>
              <p className="text-xl font-semibold">{formatValue(previousValue)}</p>
            </div>
            <div className={`text-center p-4 rounded-lg ${
              changeType === 'positive' ? 'bg-green-50' :
              changeType === 'negative' ? 'bg-red-50' : 'bg-gray-50'
            }`}>
              <p className="text-sm text-muted-foreground mb-1">Change</p>
              <div className="flex items-center justify-center space-x-2">
                {getTrendIcon()}
                <span className={`text-xl font-semibold ${
                  changeType === 'positive' ? 'text-green-600' :
                  changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {Math.abs(percentageChange).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Breakdown based on KPI type */}
        {renderDetailedBreakdown(kpiType)}

        {/* Trend Chart */}
        {trend && trend.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Trend Analysis</h3>
            <div className="flex items-end justify-center space-x-1 h-32 bg-gray-50 rounded-lg p-4">
              {trend.map((value, index) => {
                const max = Math.max(...trend);
                const min = Math.min(...trend);
                const range = max - min || 1;
                const height = ((value - min) / range) * 100 + 10;
                return (
                  <div
                    key={index}
                    className={`w-4 rounded-sm ${
                      changeType === 'positive' ? 'bg-green-400' :
                      changeType === 'negative' ? 'bg-red-400' : 'bg-gray-400'
                    }`}
                    style={{ height: `${height}px` }}
                    title={`Period ${index + 1}: ${formatValue(value)}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Performance Insights */}
        {renderPerformanceInsights(kpiType)}

        {/* Actionable Recommendations */}
        {renderActionableRecommendations(kpiType)}
      </div>
    );
  };

  const renderDetailedBreakdown = (kpiType: string) => {
    if (!data || data.length === 0) return null;

    switch (kpiType) {
      case 'revenue':
        return renderRevenueBreakdown();
      case 'orders':
        return renderOrdersBreakdown();
      case 'customers':
        return renderCustomersBreakdown();
      case 'aov':
        return renderAOVBreakdown();
      default:
        return null;
    }
  };

  const renderRevenueBreakdown = () => {
    if (!data || data.length === 0) return null;

    // Calculate revenue statistics
    const revenues = data.map((d: any) => d.revenue || d.total_revenue || 0);
    const totalRevenue = revenues.reduce((sum, rev) => sum + rev, 0);
    const avgDailyRevenue = totalRevenue / revenues.length;
    const maxRevenue = Math.max(...revenues);
    const minRevenue = Math.min(...revenues);
    const revenueGrowth = revenues.length > 1 ? ((revenues[revenues.length - 1] - revenues[0]) / revenues[0]) * 100 : 0;

    // Find best and worst performing days
    const bestDay = data.find((d: any) => (d.revenue || d.total_revenue || 0) === maxRevenue);
    const worstDay = data.find((d: any) => (d.revenue || d.total_revenue || 0) === minRevenue);

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Revenue Breakdown</h3>
        
        {/* Revenue Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Daily Average</p>
            <p className="text-lg font-semibold text-blue-600">{formatCurrency(avgDailyRevenue)}</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Best Day</p>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(maxRevenue)}</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Lowest Day</p>
            <p className="text-lg font-semibold text-red-600">{formatCurrency(minRevenue)}</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Growth Rate</p>
            <p className={`text-lg font-semibold ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Best/Worst Performance Days */}
        {bestDay && worstDay && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">🏆 Best Performance</h4>
              <p className="text-sm text-green-700">
                {bestDay.date ? new Date(bestDay.date).toLocaleDateString() : 'N/A'}: {formatCurrency(maxRevenue)}
                {bestDay.orders && <span className="block text-xs">({bestDay.orders} orders)</span>}
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">📉 Needs Attention</h4>
              <p className="text-sm text-red-700">
                {worstDay.date ? new Date(worstDay.date).toLocaleDateString() : 'N/A'}: {formatCurrency(minRevenue)}
                {worstDay.orders && <span className="block text-xs">({worstDay.orders} orders)</span>}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOrdersBreakdown = () => {
    if (!data || data.length === 0) return null;

    // Calculate top products by orders
    const sortedProducts = [...data].sort((a: any, b: any) => (b.orders_count || 0) - (a.orders_count || 0));
    const topProducts = sortedProducts.slice(0, 5);
    const totalOrders = data.reduce((sum: number, item: any) => sum + (item.orders_count || 0), 0);

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Orders Breakdown</h3>
        
        {/* Top Products by Orders */}
        <div>
          <h4 className="font-medium mb-3">Top Products by Orders</h4>
          <div className="space-y-2">
            {topProducts.map((product: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="font-medium text-sm">{product.product_name || 'Unknown Product'}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{product.orders_count || 0} orders</span>
                  <span className="text-xs text-gray-600 block">
                    {totalOrders > 0 ? ((product.orders_count || 0) / totalOrders * 100).toFixed(1) : 0}% of total
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Value Distribution */}
        {data.some((d: any) => d.avg_order_value) && (
          <div>
            <h4 className="font-medium mb-3">Order Value Analysis</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Highest AOV Product</p>
                <p className="text-sm font-semibold">
                  {[...data].sort((a: any, b: any) => (b.avg_order_value || 0) - (a.avg_order_value || 0))[0]?.product_name || 'N/A'}
                </p>
                <p className="text-xs text-blue-600">
                  {formatCurrency([...data].sort((a: any, b: any) => (b.avg_order_value || 0) - (a.avg_order_value || 0))[0]?.avg_order_value || 0)}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Most Revenue</p>
                <p className="text-sm font-semibold">
                  {[...data].sort((a: any, b: any) => (b.revenue || 0) - (a.revenue || 0))[0]?.product_name || 'N/A'}
                </p>
                <p className="text-xs text-green-600">
                  {formatCurrency([...data].sort((a: any, b: any) => (b.revenue || 0) - (a.revenue || 0))[0]?.revenue || 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCustomersBreakdown = () => {
    if (!data || data.length === 0) return null;

    // Calculate customer statistics
    const totalSpent = data.reduce((sum: number, customer: any) => sum + (customer.total_spent || 0), 0);
    const avgSpent = totalSpent / data.length;
    const topSpender = [...data].sort((a: any, b: any) => (b.total_spent || 0) - (a.total_spent || 0))[0];
    const mostOrders = [...data].sort((a: any, b: any) => (b.total_orders || 0) - (a.total_orders || 0))[0];

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">New Customers Analysis</h3>
        
        {/* Customer Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Average Spent</p>
            <p className="text-lg font-semibold text-blue-600">{formatCurrency(avgSpent)}</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Total Value</p>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(totalSpent)}</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Customers</p>
            <p className="text-lg font-semibold text-purple-600">{data.length}</p>
          </div>
        </div>

        {/* Top New Customers */}
        <div>
          <h4 className="font-medium mb-3">Highest Value New Customers</h4>
          <div className="space-y-2">
            {[...data].sort((a: any, b: any) => (b.total_spent || 0) - (a.total_spent || 0)).slice(0, 5).map((customer: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <span className="font-medium text-sm block">{customer.customer_name || 'Unknown Customer'}</span>
                    <span className="text-xs text-gray-600">{customer.email || 'No email'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{formatCurrency(customer.total_spent || 0)}</span>
                  <span className="text-xs text-gray-600 block">
                    {customer.total_orders || 0} orders
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Insights */}
        {topSpender && mostOrders && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">💰 Top Spender</h4>
              <p className="text-sm text-green-700">
                {topSpender.customer_name}: {formatCurrency(topSpender.total_spent || 0)}
                <span className="block text-xs">First order: {formatCurrency(topSpender.first_order_value || 0)}</span>
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">🔄 Most Active</h4>
              <p className="text-sm text-blue-700">
                {mostOrders.customer_name}: {mostOrders.total_orders || 0} orders
                <span className="block text-xs">Total spent: {formatCurrency(mostOrders.total_spent || 0)}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAOVBreakdown = () => {
    if (!data || data.length === 0) return null;

    // Calculate AOV statistics
    const aovValues = data.map((d: any) => d.avg_order_value || 0).filter(v => v > 0);
    const avgAOV = aovValues.reduce((sum, aov) => sum + aov, 0) / aovValues.length;
    const maxAOV = Math.max(...aovValues);
    const minAOV = Math.min(...aovValues);
    const aovTrend = aovValues.length > 1 ? ((aovValues[aovValues.length - 1] - aovValues[0]) / aovValues[0]) * 100 : 0;

    // Find best and worst AOV days
    const bestAOVDay = data.find((d: any) => (d.avg_order_value || 0) === maxAOV);
    const worstAOVDay = data.find((d: any) => (d.avg_order_value || 0) === minAOV);

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Average Order Value Analysis</h3>
        
        {/* AOV Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Period Average</p>
            <p className="text-lg font-semibold text-blue-600">{formatCurrency(avgAOV)}</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Highest AOV</p>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(maxAOV)}</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Lowest AOV</p>
            <p className="text-lg font-semibold text-red-600">{formatCurrency(minAOV)}</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">AOV Trend</p>
            <p className={`text-lg font-semibold ${aovTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {aovTrend >= 0 ? '+' : ''}{aovTrend.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* AOV Range Analysis */}
        <div>
          <h4 className="font-medium mb-3">Order Value Distribution</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">High Value Orders</p>
              <p className="text-sm font-semibold text-green-700">
                {data.filter((d: any) => (d.avg_order_value || 0) > avgAOV * 1.5).length} days
              </p>
              <p className="text-xs text-green-600">Above {formatCurrency(avgAOV * 1.5)}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Average Range</p>
              <p className="text-sm font-semibold text-blue-700">
                {data.filter((d: any) => {
                  const aov = d.avg_order_value || 0;
                  return aov >= avgAOV * 0.8 && aov <= avgAOV * 1.2;
                }).length} days
              </p>
              <p className="text-xs text-blue-600">{formatCurrency(avgAOV * 0.8)} - {formatCurrency(avgAOV * 1.2)}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Low Value Orders</p>
              <p className="text-sm font-semibold text-red-700">
                {data.filter((d: any) => (d.avg_order_value || 0) < avgAOV * 0.8).length} days
              </p>
              <p className="text-xs text-red-600">Below {formatCurrency(avgAOV * 0.8)}</p>
            </div>
          </div>
        </div>

        {/* Best/Worst AOV Days */}
        {bestAOVDay && worstAOVDay && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">🎯 Highest AOV Day</h4>
              <p className="text-sm text-green-700">
                {bestAOVDay.date ? new Date(bestAOVDay.date).toLocaleDateString() : 'N/A'}: {formatCurrency(maxAOV)}
                {bestAOVDay.orders_count && <span className="block text-xs">({bestAOVDay.orders_count} orders)</span>}
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">📊 Lowest AOV Day</h4>
              <p className="text-sm text-red-700">
                {worstAOVDay.date ? new Date(worstAOVDay.date).toLocaleDateString() : 'N/A'}: {formatCurrency(minAOV)}
                {worstAOVDay.orders_count && <span className="block text-xs">({worstAOVDay.orders_count} orders)</span>}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPerformanceInsights = (kpiType: string) => {
    const insights = [];

    if (previousValue !== undefined) {
      const changeDirection = changeType === 'positive' ? 'increased' : changeType === 'negative' ? 'decreased' : 'remained stable';
      const changeImpact = Math.abs(percentageChange) > 20 ? 'significantly' : Math.abs(percentageChange) > 10 ? 'moderately' : 'slightly';
      
      insights.push(`${title} has ${changeImpact} ${changeDirection} by ${Math.abs(percentageChange).toFixed(1)}% compared to the previous period`);
      
      if (changeType === 'positive' && Math.abs(percentageChange) > 15) {
        insights.push(`This represents strong growth and indicates positive business momentum`);
      } else if (changeType === 'negative' && Math.abs(percentageChange) > 15) {
        insights.push(`This decline warrants attention and may require strategic intervention`);
      }
    }

    if (trend && trend.length > 0) {
      const trendDirection = trend[trend.length - 1] > trend[0] ? 'upward' : trend[trend.length - 1] < trend[0] ? 'downward' : 'stable';
      const volatility = Math.max(...trend) - Math.min(...trend);
      const avgValue = trend.reduce((sum, val) => sum + val, 0) / trend.length;
      const volatilityPercent = (volatility / avgValue) * 100;
      
      insights.push(`The trend shows ${trendDirection} movement with ${volatilityPercent > 30 ? 'high' : volatilityPercent > 15 ? 'moderate' : 'low'} volatility`);
    }

    // Add KPI-specific insights
    switch (kpiType) {
      case 'revenue':
        if (data && data.length > 0) {
          const revenues = data.map((d: any) => d.revenue || d.total_revenue || 0);
          const consistency = (Math.min(...revenues) / Math.max(...revenues)) * 100;
          insights.push(`Revenue consistency is ${consistency > 70 ? 'high' : consistency > 40 ? 'moderate' : 'low'} (${consistency.toFixed(1)}%)`);
        }
        break;
      case 'orders':
        if (data && data.length > 0) {
          const totalProducts = data.length;
          const topProductShare = data[0] ? ((data[0].orders_count || 0) / data.reduce((sum: number, p: any) => sum + (p.orders_count || 0), 0)) * 100 : 0;
          insights.push(`Product portfolio shows ${topProductShare > 50 ? 'high concentration' : topProductShare > 30 ? 'moderate concentration' : 'good diversification'} with top product at ${topProductShare.toFixed(1)}%`);
        }
        break;
      case 'customers':
        if (data && data.length > 0) {
          const avgSpent = data.reduce((sum: number, c: any) => sum + (c.total_spent || 0), 0) / data.length;
          const repeatCustomers = data.filter((c: any) => (c.total_orders || 0) > 1).length;
          const repeatRate = (repeatCustomers / data.length) * 100;
          insights.push(`${repeatRate.toFixed(1)}% of new customers made repeat purchases, indicating ${repeatRate > 30 ? 'strong' : repeatRate > 15 ? 'moderate' : 'weak'} customer retention`);
        }
        break;
      case 'aov':
        if (data && data.length > 0) {
          const aovValues = data.map((d: any) => d.avg_order_value || 0).filter(v => v > 0);
          const aovStability = (Math.min(...aovValues) / Math.max(...aovValues)) * 100;
          insights.push(`AOV stability is ${aovStability > 80 ? 'very high' : aovStability > 60 ? 'high' : aovStability > 40 ? 'moderate' : 'low'} indicating ${aovStability > 60 ? 'consistent' : 'variable'} customer spending patterns`);
        }
        break;
    }

    if (insights.length === 0) return null;

    return (
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Performance Insights</h3>
        <div className="bg-blue-50 p-4 rounded-lg">
          <ul className="space-y-2 text-sm">
            {insights.map((insight, index) => (
              <li key={index}>• {insight}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderActionableRecommendations = (kpiType: string) => {
    const recommendations = [];

    // General recommendations based on performance
    if (previousValue !== undefined) {
      if (changeType === 'negative' && Math.abs(percentageChange) > 10) {
        recommendations.push({
          type: 'urgent',
          title: 'Address Performance Decline',
          action: `Investigate the ${Math.abs(percentageChange).toFixed(1)}% decline and implement corrective measures`
        });
      } else if (changeType === 'positive' && Math.abs(percentageChange) > 20) {
        recommendations.push({
          type: 'opportunity',
          title: 'Scale Success Factors',
          action: `Identify what drove the ${Math.abs(percentageChange).toFixed(1)}% improvement and replicate it`
        });
      }
    }

    // KPI-specific recommendations
    switch (kpiType) {
      case 'revenue':
        if (changeType === 'negative') {
          recommendations.push({
            type: 'action',
            title: 'Revenue Recovery Strategy',
            action: 'Focus on high-value customers, optimize pricing, and enhance product offerings'
          });
        } else if (changeType === 'positive') {
          recommendations.push({
            type: 'growth',
            title: 'Revenue Optimization',
            action: 'Consider upselling strategies and expanding successful product lines'
          });
        }
        break;

      case 'orders':
        if (data && data.length > 0) {
          const topProductShare = data[0] ? ((data[0].orders_count || 0) / data.reduce((sum: number, p: any) => sum + (p.orders_count || 0), 0)) * 100 : 0;
          if (topProductShare > 50) {
            recommendations.push({
              type: 'risk',
              title: 'Diversify Product Portfolio',
              action: 'Reduce dependency on top product by promoting other products and expanding catalog'
            });
          }
        }
        break;

      case 'customers':
        if (data && data.length > 0) {
          const repeatCustomers = data.filter((c: any) => (c.total_orders || 0) > 1).length;
          const repeatRate = (repeatCustomers / data.length) * 100;
          if (repeatRate < 20) {
            recommendations.push({
              type: 'retention',
              title: 'Improve Customer Retention',
              action: 'Implement loyalty programs, follow-up campaigns, and personalized recommendations'
            });
          }
        }
        break;

      case 'aov':
        if (changeType === 'negative') {
          recommendations.push({
            type: 'action',
            title: 'Increase Average Order Value',
            action: 'Implement bundling, cross-selling, and minimum order incentives'
          });
        }
        break;
    }

    // Add general optimization recommendations
    recommendations.push({
      type: 'optimization',
      title: 'Continuous Monitoring',
      action: 'Set up alerts for significant changes and review performance weekly'
    });

    if (recommendations.length === 0) return null;

    const getRecommendationStyle = (type: string) => {
      switch (type) {
        case 'urgent': return 'bg-red-50 border-red-200 text-red-800';
        case 'opportunity': return 'bg-green-50 border-green-200 text-green-800';
        case 'action': return 'bg-blue-50 border-blue-200 text-blue-800';
        case 'growth': return 'bg-purple-50 border-purple-200 text-purple-800';
        case 'risk': return 'bg-orange-50 border-orange-200 text-orange-800';
        case 'retention': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
        default: return 'bg-gray-50 border-gray-200 text-gray-800';
      }
    };

    const getRecommendationIcon = (type: string) => {
      switch (type) {
        case 'urgent': return '🚨';
        case 'opportunity': return '🚀';
        case 'action': return '⚡';
        case 'growth': return '📈';
        case 'risk': return '⚠️';
        case 'retention': return '🔄';
        default: return '💡';
      }
    };

    return (
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Actionable Recommendations</h3>
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getRecommendationStyle(rec.type)}`}>
              <div className="flex items-start space-x-3">
                <span className="text-lg">{getRecommendationIcon(rec.type)}</span>
                <div>
                  <h4 className="font-medium mb-1">{rec.title}</h4>
                  <p className="text-sm">{rec.action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div>
        <Card className="transition-all duration-200 hover:shadow-sm group">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {title}
              </p>
              <div className="flex items-center space-x-1">
                <div className="text-muted-foreground">
                  {React.cloneElement(icon as React.ReactElement, {
                    className: 'w-4 h-4'
                  })}
                </div>
                
                {/* Export/Expand buttons - shown on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={isDownloading}
                        className="h-6 w-6 p-0"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={downloadPNG}>
                        <Image className="h-3 w-3 mr-2" />
                        PNG
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={downloadPDF}>
                        <FileText className="h-3 w-3 mr-2" />
                        PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={downloadCSV}>
                        <FileSpreadsheet className="h-3 w-3 mr-2" />
                        CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsExpanded(true)}
                    className="h-6 w-6 p-0"
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-3" ref={contentRef}>
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
      </div>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-medium text-black">{title} - Detailed View</DialogTitle>
          </DialogHeader>
          <div ref={contentRef}>
            {renderExpandedContent()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedKPICard;