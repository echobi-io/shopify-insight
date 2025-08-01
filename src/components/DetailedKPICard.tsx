import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Maximize2, Download, FileText, Image, FileSpreadsheet, Calendar, Users, ShoppingCart, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatCurrency } from '@/lib/utils/settingsUtils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface DetailedKPICardProps {
  title: string;
  value: number;
  previousValue?: number;
  icon: React.ReactNode;
  isMonetary?: boolean;
  size?: 'small' | 'normal';
  trend?: number[];
  detailedData?: any[];
  filename?: string;
  kpiType: 'revenue' | 'orders' | 'customers' | 'aov';
}

const DetailedKPICard: React.FC<DetailedKPICardProps> = ({
  title,
  value,
  previousValue,
  icon,
  isMonetary = false,
  size = 'normal',
  trend,
  detailedData = [],
  filename,
  kpiType
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  };

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
    try {
      let csvData = [];
      
      if (detailedData && detailedData.length > 0) {
        csvData = detailedData;
      } else {
        // Create basic CSV with KPI data
        csvData = [
          { metric: title, current_value: value, previous_value: previousValue || 0, variance, percentage_change: percentageChange }
        ];
      }
      
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

  const renderDetailedChart = () => {
    if (!detailedData || detailedData.length === 0) return null;

    switch (kpiType) {
      case 'revenue':
        return (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={detailedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  stroke="#666"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis fontSize={12} stroke="#666" />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'orders':
        return (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={detailedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="product_name" 
                  fontSize={12}
                  stroke="#666"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis fontSize={12} stroke="#666" />
                <Tooltip 
                  formatter={(value: any) => [new Intl.NumberFormat('en-US').format(value), 'Orders']}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <Bar dataKey="orders_count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'aov':
        return (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={detailedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  stroke="#666"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis fontSize={12} stroke="#666" />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: any) => [formatCurrency(value), 'AOV']}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avg_order_value" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return null;
    }
  };

  const renderDetailedTable = () => {
    if (!detailedData || detailedData.length === 0) return null;

    switch (kpiType) {
      case 'revenue':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>AOV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailedData.slice(0, 10).map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                  <TableCell>{formatCurrency(item.revenue)}</TableCell>
                  <TableCell>{item.orders}</TableCell>
                  <TableCell>{formatCurrency(item.avg_order_value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'orders':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailedData.slice(0, 10).map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell>{item.orders_count}</TableCell>
                  <TableCell>{formatCurrency(item.revenue)}</TableCell>
                  <TableCell>{item.percentage_of_total.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'customers':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>First Order</TableHead>
                <TableHead>Total Orders</TableHead>
                <TableHead>Total Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailedData.slice(0, 10).map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.customer_name}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{new Date(item.first_order_date).toLocaleDateString()}</TableCell>
                  <TableCell>{item.total_orders}</TableCell>
                  <TableCell>{formatCurrency(item.total_spent)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'aov':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>AOV</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Min Order</TableHead>
                <TableHead>Max Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailedData.slice(0, 10).map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                  <TableCell>{formatCurrency(item.avg_order_value)}</TableCell>
                  <TableCell>{item.orders_count}</TableCell>
                  <TableCell>{formatCurrency(item.min_order_value)}</TableCell>
                  <TableCell>{formatCurrency(item.max_order_value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      default:
        return null;
    }
  };

  const renderExpandedContent = () => (
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

      {/* Detailed Chart */}
      {detailedData && detailedData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Detailed Analysis</h3>
          {renderDetailedChart()}
        </div>
      )}

      {/* Detailed Table */}
      {detailedData && detailedData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {kpiType === 'revenue' && 'Daily Revenue Breakdown'}
            {kpiType === 'orders' && 'Orders by Product'}
            {kpiType === 'customers' && 'New Customers'}
            {kpiType === 'aov' && 'Average Order Value Stats'}
          </h3>
          <div className="max-h-96 overflow-auto">
            {renderDetailedTable()}
          </div>
          {detailedData.length > 10 && (
            <p className="text-sm text-muted-foreground">
              Showing top 10 of {detailedData.length} records. Download CSV for complete data.
            </p>
          )}
        </div>
      )}

      {/* Insights */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Insights</h3>
        <div className="bg-blue-50 p-4 rounded-lg">
          <ul className="space-y-2 text-sm">
            {previousValue !== undefined && (
              <>
                <li>
                  • {changeType === 'positive' ? 'Increased' : changeType === 'negative' ? 'Decreased' : 'Remained stable'} by {formatVariance(variance)} compared to previous period
                </li>
                <li>
                  • Represents a {Math.abs(percentageChange).toFixed(1)}% {changeType === 'positive' ? 'improvement' : changeType === 'negative' ? 'decline' : 'stability'}
                </li>
              </>
            )}
            {detailedData && detailedData.length > 0 && (
              <li>
                • Based on {detailedData.length} data points in the selected period
              </li>
            )}
            {trend && trend.length > 0 && (
              <li>
                • Trend shows {trend[trend.length - 1] > trend[0] ? 'upward' : trend[trend.length - 1] < trend[0] ? 'downward' : 'stable'} movement over time
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <motion.div variants={fadeInUp}>
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
      </motion.div>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-auto">
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

export default DetailedKPICard;