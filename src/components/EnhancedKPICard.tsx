import React, { useState, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus, Maximize2, Download, FileText, Image, FileSpreadsheet, HelpCircle, ChevronDown, ChevronUp, Info, Package, Users, Star, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/utils/settingsUtils';
import { safePercentage, safeNumber, formatCurrency as safeCurrency, formatNumber } from '@/lib/utils/numberUtils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
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
  const [helpExpanded, setHelpExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Calculate variance and percentage change using safe utilities
  const variance = previousValue !== undefined ? safeNumber(value) - safeNumber(previousValue) : 0;
  const percentageChange = previousValue !== undefined && safeNumber(previousValue) !== 0 
    ? ((safeNumber(value) - safeNumber(previousValue)) / safeNumber(previousValue)) * 100 
    : 0;

  // Determine change type based on actual improvement/decline, not just variance sign
  const changeType = previousValue !== undefined ? (
    // If previous was negative and current is positive, that's positive change
    (previousValue < 0 && value > 0) ? 'positive' :
    // If previous was positive and current is negative, that's negative change  
    (previousValue > 0 && value < 0) ? 'negative' :
    // Otherwise, use variance to determine direction
    variance > 0 ? 'positive' : variance < 0 ? 'negative' : 'neutral'
  ) : 'neutral';

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

  const getKPIType = () => {
    return title.toLowerCase().includes('revenue') ? 'revenue' :
           title.toLowerCase().includes('order') ? 'orders' :
           title.toLowerCase().includes('customer') ? 'customers' :
           title.toLowerCase().includes('average') || title.toLowerCase().includes('aov') ? 'aov' : 'general';
  };

  const getHelpContent = () => {
    const kpiType = getKPIType();
    
    const helpContent = {
      revenue: {
        title: "Understanding Revenue",
        definition: "Total monetary value of all completed orders in the selected time period.",
        calculation: "Sum of all order values (excluding taxes, shipping, and refunds)",
        importance: "Revenue is the primary indicator of business performance and growth. It shows how much money your business is generating from sales.",
        factors: [
          "Number of orders placed",
          "Average order value",
          "Product pricing strategy",
          "Marketing effectiveness",
          "Seasonal trends"
        ],
        interpretation: {
          positive: "Increasing revenue indicates business growth, successful marketing campaigns, or improved product-market fit.",
          negative: "Declining revenue may signal market challenges, increased competition, or need for strategy adjustment.",
          stable: "Stable revenue suggests consistent performance but may indicate need for growth initiatives."
        }
      },
      orders: {
        title: "Understanding Orders",
        definition: "Total number of completed purchase transactions in the selected time period.",
        calculation: "Count of all successfully processed orders",
        importance: "Order volume indicates customer demand and business activity level. It's a key metric for operational planning.",
        factors: [
          "Marketing campaign effectiveness",
          "Website traffic and conversion rates",
          "Product availability",
          "Customer satisfaction",
          "Seasonal patterns"
        ],
        interpretation: {
          positive: "Increasing orders show growing customer demand and successful acquisition strategies.",
          negative: "Declining orders may indicate conversion issues, inventory problems, or market challenges.",
          stable: "Consistent order volume suggests stable demand but may require growth strategies."
        }
      },
      customers: {
        title: "Understanding New Customers",
        definition: "Number of unique customers who made their first purchase in the selected time period.",
        calculation: "Count of customers with first order date within the period",
        importance: "New customer acquisition is essential for business growth and replacing churned customers.",
        factors: [
          "Marketing and advertising spend",
          "Brand awareness campaigns",
          "Referral programs",
          "Product launches",
          "Market expansion"
        ],
        interpretation: {
          positive: "Growing new customer base indicates successful acquisition strategies and market expansion.",
          negative: "Declining new customers may signal acquisition challenges or market saturation.",
          stable: "Steady new customer flow is healthy but may need acceleration for growth."
        }
      },
      aov: {
        title: "Understanding Average Order Value (AOV)",
        definition: "Average monetary value of each order in the selected time period.",
        calculation: "Total Revenue ÷ Total Number of Orders",
        importance: "AOV indicates customer spending behavior and is crucial for profitability and growth strategies.",
        factors: [
          "Product pricing strategy",
          "Upselling and cross-selling",
          "Product bundling",
          "Customer segments",
          "Promotional strategies"
        ],
        interpretation: {
          positive: "Increasing AOV shows customers are spending more per transaction, improving profitability.",
          negative: "Declining AOV may indicate price sensitivity or need for better upselling strategies.",
          stable: "Consistent AOV suggests stable customer behavior but may benefit from optimization."
        }
      }
    };

    return helpContent[kpiType as keyof typeof helpContent] || helpContent.revenue;
  };

  const renderTimeseriesChart = () => {
    if (!data || data.length === 0) return null;

    const kpiType = getKPIType();
    let chartData: any[] = [];
    let dataKey = '';
    let chartTitle = '';
    let yAxisLabel = '';
    let isBarChart = false;

    switch (kpiType) {
      case 'revenue':
        chartData = data.map((d: any) => ({
          date: d.date ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
          value: d.revenue || d.total_revenue || 0,
          orders: d.orders || d.order_count || 0
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        dataKey = 'value';
        chartTitle = 'Revenue Trend';
        yAxisLabel = 'Revenue';
        break;

      case 'orders':
        if (data.some((d: any) => d.product_name)) {
          const topProducts = [...data].sort((a: any, b: any) => (b.orders_count || 0) - (a.orders_count || 0)).slice(0, 8);
          chartData = topProducts.map((d: any) => ({
            name: (d.product_name || 'Unknown').length > 15 ? 
                  (d.product_name || 'Unknown').substring(0, 15) + '...' : 
                  (d.product_name || 'Unknown'),
            value: d.orders_count || 0,
            revenue: d.revenue || 0
          }));
          dataKey = 'value';
          chartTitle = 'Orders by Product';
          yAxisLabel = 'Orders';
          isBarChart = true;
        }
        break;

      case 'customers':
        chartData = data.map((d: any, index: number) => ({
          date: d.first_order_date ? new Date(d.first_order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `Customer ${index + 1}`,
          value: d.total_spent || 0,
          orders: d.total_orders || 0
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 15);
        dataKey = 'value';
        chartTitle = 'New Customer Value Timeline';
        yAxisLabel = 'Customer Value';
        break;

      case 'aov':
        chartData = data.map((d: any) => ({
          date: d.date ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
          value: d.avg_order_value || 0,
          orders: d.orders_count || 0,
          revenue: d.total_revenue || 0
        })).sort((a, b) => {
          const dateA = new Date(a.date === 'N/A' ? '1970-01-01' : a.date);
          const dateB = new Date(b.date === 'N/A' ? '1970-01-01' : b.date);
          return dateA.getTime() - dateB.getTime();
        });
        dataKey = 'value';
        chartTitle = 'Average Order Value Trend';
        yAxisLabel = 'AOV';
        break;

      default:
        return null;
    }

    if (chartData.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">{chartTitle}</h3>
        </div>
        <div className="h-80 w-full bg-gray-50 rounded-lg p-4">
          <ResponsiveContainer width="100%" height="100%">
            {isBarChart ? (
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  fontSize={11}
                  stroke="#6b7280"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis fontSize={12} stroke="#6b7280" />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'value' ? `${value} orders` : formatCurrency(value),
                    name === 'value' ? 'Orders' : 'Revenue'
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey={dataKey} 
                  fill="#3b82f6"
                  name="Orders"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  stroke="#6b7280"
                />
                <YAxis fontSize={12} stroke="#6b7280" />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    isMonetary ? formatCurrency(value) : formatValue(value),
                    yAxisLabel
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey={dataKey} 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderProductCustomerInsights = () => {
    if (!data || data.length === 0) return null;

    const kpiType = getKPIType();

    switch (kpiType) {
      case 'revenue':
        return renderRevenueInsights();
      case 'orders':
        return renderOrdersInsights();
      case 'customers':
        return renderCustomerInsights();
      case 'aov':
        return renderAOVInsights();
      default:
        return null;
    }
  };

  const renderRevenueInsights = () => {
    const revenues = data.map((d: any) => d.revenue || d.total_revenue || 0);
    const totalRevenue = revenues.reduce((sum, rev) => sum + rev, 0);
    const avgDailyRevenue = totalRevenue / revenues.length;
    const maxRevenue = Math.max(...revenues);
    const minRevenue = Math.min(...revenues);
    const bestDay = data.find((d: any) => (d.revenue || d.total_revenue || 0) === maxRevenue);
    const worstDay = data.find((d: any) => (d.revenue || d.total_revenue || 0) === minRevenue);

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Package className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Revenue Insights</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-sm text-blue-600 font-medium mb-1">Daily Average</p>
            <p className="text-xl font-bold text-blue-800">{formatCurrency(avgDailyRevenue)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-sm text-green-600 font-medium mb-1">Best Day</p>
            <p className="text-xl font-bold text-green-800">{formatCurrency(maxRevenue)}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <p className="text-sm text-red-600 font-medium mb-1">Lowest Day</p>
            <p className="text-xl font-bold text-red-800">{formatCurrency(minRevenue)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <p className="text-sm text-purple-600 font-medium mb-1">Volatility</p>
            <p className="text-xl font-bold text-purple-800">{((maxRevenue - minRevenue) / avgDailyRevenue * 100).toFixed(0)}%</p>
          </div>
        </div>

        {bestDay && worstDay && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-4 h-4 text-green-600" />
                <h4 className="font-semibold text-green-800">Best Performance</h4>
              </div>
              <p className="text-sm text-green-700">
                {bestDay.date ? new Date(bestDay.date).toLocaleDateString() : 'N/A'}
              </p>
              <p className="text-lg font-bold text-green-800">{formatCurrency(maxRevenue)}</p>
              {bestDay.orders && <p className="text-xs text-green-600">{bestDay.orders} orders</p>}
            </div>
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="w-4 h-4 text-red-600" />
                <h4 className="font-semibold text-red-800">Needs Attention</h4>
              </div>
              <p className="text-sm text-red-700">
                {worstDay.date ? new Date(worstDay.date).toLocaleDateString() : 'N/A'}
              </p>
              <p className="text-lg font-bold text-red-800">{formatCurrency(minRevenue)}</p>
              {worstDay.orders && <p className="text-xs text-red-600">{worstDay.orders} orders</p>}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOrdersInsights = () => {
    const hasProductData = data.some((d: any) => d.product_name);
    if (!hasProductData) return null;

    const sortedProducts = [...data].sort((a: any, b: any) => (b.orders_count || 0) - (a.orders_count || 0));
    const topProducts = sortedProducts.slice(0, 5);
    const totalOrders = data.reduce((sum: number, item: any) => sum + (item.orders_count || 0), 0);

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Package className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Product Performance</h3>
        </div>
        
        <div className="space-y-3">
          {topProducts.map((product: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{product.product_name || 'Unknown Product'}</p>
                  <p className="text-sm text-gray-600">
                    {safePercentage(totalOrders > 0 ? ((product.orders_count || 0) / totalOrders * 100) : 0)} of total orders
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{product.orders_count || 0}</p>
                <p className="text-sm text-gray-600">orders</p>
              </div>
            </div>
          ))}
        </div>

        {data.some((d: any) => d.avg_order_value) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Highest AOV Product</h4>
              <p className="text-sm font-medium text-blue-700">
                {[...data].sort((a: any, b: any) => (b.avg_order_value || 0) - (a.avg_order_value || 0))[0]?.product_name || 'N/A'}
              </p>
              <p className="text-lg font-bold text-blue-800">
                {formatCurrency([...data].sort((a: any, b: any) => (b.avg_order_value || 0) - (a.avg_order_value || 0))[0]?.avg_order_value || 0)}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Top Revenue Product</h4>
              <p className="text-sm font-medium text-green-700">
                {[...data].sort((a: any, b: any) => (b.revenue || 0) - (a.revenue || 0))[0]?.product_name || 'N/A'}
              </p>
              <p className="text-lg font-bold text-green-800">
                {formatCurrency([...data].sort((a: any, b: any) => (b.revenue || 0) - (a.revenue || 0))[0]?.revenue || 0)}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCustomerInsights = () => {
    const totalSpent = data.reduce((sum: number, customer: any) => sum + (customer.total_spent || 0), 0);
    const avgSpent = totalSpent / data.length;
    const topCustomers = [...data].sort((a: any, b: any) => (b.total_spent || 0) - (a.total_spent || 0)).slice(0, 5);
    const repeatCustomers = data.filter((c: any) => (c.total_orders || 0) > 1).length;
    const repeatRate = (repeatCustomers / data.length) * 100;

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Customer Insights</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-sm text-blue-600 font-medium mb-1">Average Spent</p>
            <p className="text-xl font-bold text-blue-800">{formatCurrency(avgSpent)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-sm text-green-600 font-medium mb-1">Total Value</p>
            <p className="text-xl font-bold text-green-800">{formatCurrency(totalSpent)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <p className="text-sm text-purple-600 font-medium mb-1">New Customers</p>
            <p className="text-xl font-bold text-purple-800">{data.length}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <p className="text-sm text-orange-600 font-medium mb-1">Repeat Rate</p>
            <p className="text-xl font-bold text-orange-800">{safePercentage(repeatRate)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Top New Customers</h4>
          {topCustomers.map((customer: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{customer.customer_name || 'Unknown Customer'}</p>
                  <p className="text-sm text-gray-600">{customer.email || 'No email'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{formatCurrency(customer.total_spent || 0)}</p>
                <p className="text-sm text-gray-600">{customer.total_orders || 0} orders</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAOVInsights = () => {
    const aovValues = data.map((d: any) => d.avg_order_value || 0).filter(v => v > 0);
    const avgAOV = aovValues.reduce((sum, aov) => sum + aov, 0) / aovValues.length;
    const maxAOV = Math.max(...aovValues);
    const minAOV = Math.min(...aovValues);
    const totalOrders = data.reduce((sum: number, d: any) => sum + (d.orders_count || 0), 0);
    const totalRevenue = data.reduce((sum: number, d: any) => sum + (d.total_revenue || 0), 0);

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">AOV Analysis</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-sm text-blue-600 font-medium mb-1">Average AOV</p>
            <p className="text-xl font-bold text-blue-800">{formatCurrency(avgAOV)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-sm text-green-600 font-medium mb-1">Highest AOV</p>
            <p className="text-xl font-bold text-green-800">{formatCurrency(maxAOV)}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <p className="text-sm text-red-600 font-medium mb-1">Lowest AOV</p>
            <p className="text-xl font-bold text-red-800">{formatCurrency(minAOV)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <p className="text-sm text-purple-600 font-medium mb-1">Consistency</p>
            <p className="text-xl font-bold text-purple-800">{((minAOV / maxAOV) * 100).toFixed(0)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600 font-medium mb-1">Total Orders</p>
            <p className="text-lg font-bold text-gray-800">{totalOrders.toLocaleString()}</p>
            <p className="text-xs text-gray-600">Across {data.length} days</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600 font-medium mb-1">Total Revenue</p>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-gray-600">Period total</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600 font-medium mb-1">Daily Avg Orders</p>
            <p className="text-lg font-bold text-gray-800">{(totalOrders / data.length).toFixed(1)}</p>
            <p className="text-xs text-gray-600">Orders per day</p>
          </div>
        </div>
      </div>
    );
  };

  const renderExpandedContent = () => {
    const helpContent = getHelpContent();

    return (
      <div className="space-y-8">
        {/* Header with KPI Value */}
        <div className="text-center border-b pb-6">
          <div className="flex items-center justify-center mb-4">
            {React.cloneElement(icon as React.ReactElement, {
              className: 'w-16 h-16 text-blue-600'
            })}
          </div>
          <h2 className="text-5xl font-bold text-gray-900 mb-2">
            {formatValue(value)}
          </h2>
          <p className="text-xl text-gray-600">{title}</p>
          
          {previousValue !== undefined && (
            <div className="flex items-center justify-center space-x-6 mt-4">
              <div className="text-center">
                <p className="text-sm text-gray-500">Current Period</p>
                <p className="text-2xl font-semibold text-gray-900">{formatValue(value)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Previous Period</p>
                <p className="text-2xl font-semibold text-gray-900">{formatValue(previousValue)}</p>
              </div>
              <div className={`text-center px-4 py-2 rounded-lg ${
                changeType === 'positive' ? 'bg-green-50' :
                changeType === 'negative' ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                <p className="text-sm text-gray-500">Change</p>
                <div className="flex items-center space-x-2">
                  {getTrendIcon()}
                  <span className={`text-2xl font-semibold ${
                    changeType === 'positive' ? 'text-green-600' :
                    changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {safePercentage(Math.abs(percentageChange))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timeseries Chart */}
        {renderTimeseriesChart()}

        {/* Product/Customer Insights */}
        {renderProductCustomerInsights()}

        {/* Help Section */}
        <div className="border-t pt-6">
          <Collapsible open={helpExpanded} onOpenChange={setHelpExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>Understanding This Metric</span>
                </div>
                {helpExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">{helpContent.title}</h4>
                  <p className="text-blue-800">{helpContent.definition}</p>
                </div>
                
                <div>
                  <h5 className="font-medium text-blue-900 mb-2">How it's calculated:</h5>
                  <p className="text-blue-800 font-mono text-sm bg-blue-100 p-2 rounded">{helpContent.calculation}</p>
                </div>
                
                <div>
                  <h5 className="font-medium text-blue-900 mb-2">Why it matters:</h5>
                  <p className="text-blue-800">{helpContent.importance}</p>
                </div>
                
                <div>
                  <h5 className="font-medium text-blue-900 mb-2">Key factors that influence this metric:</h5>
                  <ul className="text-blue-800 space-y-1">
                    {helpContent.factors.map((factor, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium text-blue-900 mb-2">How to interpret changes:</h5>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-blue-800">{helpContent.interpretation.positive}</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <TrendingDown className="w-4 h-4 text-red-600 mt-0.5" />
                      <span className="text-blue-800">{helpContent.interpretation.negative}</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Minus className="w-4 h-4 text-gray-600 mt-0.5" />
                      <span className="text-blue-800">{helpContent.interpretation.stable}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
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
                
                {/* Export/Expand buttons - always visible */}
                <div className="flex items-center space-x-1">
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
        <DialogContent className="max-w-6xl w-full max-h-[95vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-gray-900">{title} - Detailed Analysis</DialogTitle>
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