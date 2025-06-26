import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DrillThroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

const DrillThroughModal: React.FC<DrillThroughModalProps> = ({ isOpen, onClose, data }) => {
  if (!data) return null;

  const renderTimeSeriesChart = () => {
    if (!data.timeSeriesData || data.timeSeriesData.length === 0) {
      return null;
    }

    const isHourlyData = data.timeSeriesData[0]?.time;
    const xAxisKey = isHourlyData ? 'time' : 'date';
    
    return (
      <div className="mb-6">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Time Series Analysis</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey={xAxisKey} 
              fontSize={12}
              tickFormatter={(value) => {
                if (isHourlyData) {
                  return value;
                } else {
                  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }
              }}
            />
            <YAxis fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              labelFormatter={(value) => {
                if (isHourlyData) {
                  return `Time: ${value}`;
                } else {
                  return new Date(value).toLocaleDateString();
                }
              }}
              formatter={(value: any, name: string) => {
                if (name === 'revenue') return [`£${Number(value).toLocaleString()}`, 'Revenue'];
                if (name === 'orders') return [Number(value).toLocaleString(), 'Orders'];
                if (name === 'customers') return [Number(value).toLocaleString(), 'Customers'];
                if (name === 'aov') return [`£${Number(value).toFixed(2)}`, 'AOV'];
                return [value, name];
              }}
            />
            {data.timeSeriesData[0]?.revenue !== undefined && (
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
              />
            )}
            {data.timeSeriesData[0]?.orders !== undefined && (
              <Line 
                type="monotone" 
                dataKey="orders" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={false}
              />
            )}
            {data.timeSeriesData[0]?.customers !== undefined && (
              <Line 
                type="monotone" 
                dataKey="customers" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={false}
              />
            )}
            {data.timeSeriesData[0]?.aov !== undefined && (
              <Line 
                type="monotone" 
                dataKey="aov" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderContent = () => {
    switch (data.type) {
      case 'revenue':
      case 'orders':
      case 'customers':
        return (
          <div className="space-y-6">
            {renderTimeSeriesChart()}
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Detailed Records</h4>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {data.type === 'revenue' && (
                        <>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Time</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Order ID</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Customer</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Value</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                        </>
                      )}
                      {data.type === 'orders' && (
                        <>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Time</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Order ID</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Customer</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Items</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Value</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                        </>
                      )}
                      {data.type === 'customers' && (
                        <>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Name</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Email</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Signup Date</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Time</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Orders</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">LTV</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Segment</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.slice(0, 50).map((row: any, index: number) => (
                      <tr key={index} className="border-b border-border/50 hover:bg-muted/50">
                        {data.type === 'revenue' && (
                          <>
                            <td className="py-2 px-3 text-sm">{row.date}</td>
                            <td className="py-2 px-3 text-sm text-muted-foreground">{row.time}</td>
                            <td className="py-2 px-3 text-sm font-mono">{row.order_id}</td>
                            <td className="py-2 px-3 text-sm">{row.customer}</td>
                            <td className="py-2 px-3 text-sm text-right">£{Number(row.value).toLocaleString()}</td>
                            <td className="py-2 px-3 text-sm">
                              <Badge variant={row.status === 'completed' || row.status === 'delivered' ? 'default' : 'secondary'}>
                                {row.status}
                              </Badge>
                            </td>
                          </>
                        )}
                        {data.type === 'orders' && (
                          <>
                            <td className="py-2 px-3 text-sm">{row.date}</td>
                            <td className="py-2 px-3 text-sm text-muted-foreground">{row.time}</td>
                            <td className="py-2 px-3 text-sm font-mono">{row.order_id}</td>
                            <td className="py-2 px-3 text-sm">{row.customer}</td>
                            <td className="py-2 px-3 text-sm text-right">{row.items}</td>
                            <td className="py-2 px-3 text-sm text-right">£{Number(row.value).toLocaleString()}</td>
                            <td className="py-2 px-3 text-sm">
                              <Badge variant={row.status === 'completed' || row.status === 'delivered' ? 'default' : 'secondary'}>
                                {row.status}
                              </Badge>
                            </td>
                          </>
                        )}
                        {data.type === 'customers' && (
                          <>
                            <td className="py-2 px-3 text-sm">{row.name}</td>
                            <td className="py-2 px-3 text-sm">{row.email}</td>
                            <td className="py-2 px-3 text-sm">{row.signup_date}</td>
                            <td className="py-2 px-3 text-sm text-muted-foreground">{row.signup_time}</td>
                            <td className="py-2 px-3 text-sm text-right">{row.orders}</td>
                            <td className="py-2 px-3 text-sm text-right">£{Number(row.ltv).toLocaleString()}</td>
                            <td className="py-2 px-3 text-sm">
                              <Badge variant="outline">{row.segment}</Badge>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.data.length > 50 && (
                <p className="text-sm text-muted-foreground text-center mt-3">
                  Showing 50 of {data.data.length} results
                </p>
              )}
            </div>
          </div>
        );

      case 'aov':
        return (
          <div className="space-y-6">
            {renderTimeSeriesChart()}
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">AOV Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.data}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="range" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {data.data.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">{item.range}</span>
                    <span className="text-sm text-muted-foreground">{item.count} orders</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'churn':
        return (
          <div className="space-y-4">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Last Order</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Risk Score</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Predicted Churn</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">LTV</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Recommended Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.slice(0, 20).map((row: any, index: number) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2 px-3 text-sm">{row.customer}</td>
                      <td className="py-2 px-3 text-sm">{row.last_order}</td>
                      <td className="py-2 px-3 text-sm text-right">
                        <span className="text-red-600 font-medium">{row.risk_score}</span>
                      </td>
                      <td className="py-2 px-3 text-sm text-right">
                        <span className="text-orange-600 font-medium">{row.predicted_churn}</span>
                      </td>
                      <td className="py-2 px-3 text-sm text-right">£{row.ltv}</td>
                      <td className="py-2 px-3 text-sm">
                        <Badge variant="outline">{row.action}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'refunds':
        return (
          <div className="space-y-4">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Order ID</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Product</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Reason</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.slice(0, 20).map((row: any, index: number) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2 px-3 text-sm">{row.date}</td>
                      <td className="py-2 px-3 text-sm font-mono">{row.order_id}</td>
                      <td className="py-2 px-3 text-sm">{row.customer}</td>
                      <td className="py-2 px-3 text-sm">{row.product}</td>
                      <td className="py-2 px-3 text-sm text-right">£{row.amount}</td>
                      <td className="py-2 px-3 text-sm">
                        <Badge variant="outline">{row.reason}</Badge>
                      </td>
                      <td className="py-2 px-3 text-sm">
                        <Badge variant={row.status === 'processed' ? 'default' : 'secondary'}>
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'retention':
        return (
          <div className="space-y-4">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Cohort</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Customers</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Month 1</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Month 2</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Month 3</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Month 6</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Retention</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.slice(0, 20).map((row: any, index: number) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2 px-3 text-sm font-medium">{row.cohort}</td>
                      <td className="py-2 px-3 text-sm text-right">{row.customers}</td>
                      <td className="py-2 px-3 text-sm text-right">{row.month1}%</td>
                      <td className="py-2 px-3 text-sm text-right">{row.month2}%</td>
                      <td className="py-2 px-3 text-sm text-right">{row.month3}%</td>
                      <td className="py-2 px-3 text-sm text-right">{row.month6}%</td>
                      <td className="py-2 px-3 text-sm text-right">
                        <span className={row.retention > 70 ? 'text-green-600 font-medium' : row.retention > 50 ? 'text-yellow-600 font-medium' : 'text-red-600 font-medium'}>
                          {row.retention}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'trends':
        return (
          <div className="space-y-4">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Hour</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Revenue</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Orders</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Conversion</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">AOV</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.slice(0, 20).map((row: any, index: number) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2 px-3 text-sm font-mono">{row.hour}</td>
                      <td className="py-2 px-3 text-sm text-right">£{row.revenue.toLocaleString()}</td>
                      <td className="py-2 px-3 text-sm text-right">{row.orders}</td>
                      <td className="py-2 px-3 text-sm text-right">{row.conversion}%</td>
                      <td className="py-2 px-3 text-sm text-right">£{row.aov}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'product-sales':
        return (
          <div className="space-y-4">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Revenue</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Units</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Refunds</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Customers</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Repeat Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.slice(0, 20).map((row: any, index: number) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2 px-3 text-sm">{row.date}</td>
                      <td className="py-2 px-3 text-sm text-right">£{row.revenue}</td>
                      <td className="py-2 px-3 text-sm text-right">{row.units}</td>
                      <td className="py-2 px-3 text-sm text-right">£{row.refunds}</td>
                      <td className="py-2 px-3 text-sm text-right">{row.customers}</td>
                      <td className="py-2 px-3 text-sm text-right">{row.repeatOrders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'segment-analysis':
        return (
          <div className="space-y-4">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Segment</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Customers</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Revenue</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Orders</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">AOV</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Retention</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.slice(0, 20).map((row: any, index: number) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2 px-3 text-sm font-medium">{row.segment}</td>
                      <td className="py-2 px-3 text-sm text-right">{row.customers}</td>
                      <td className="py-2 px-3 text-sm text-right">£{row.revenue.toLocaleString()}</td>
                      <td className="py-2 px-3 text-sm text-right">{row.orders}</td>
                      <td className="py-2 px-3 text-sm text-right">£{row.aov.toFixed(2)}</td>
                      <td className="py-2 px-3 text-sm text-right">
                        <span className={row.retention > 70 ? 'text-green-600 font-medium' : row.retention > 50 ? 'text-yellow-600 font-medium' : 'text-red-600 font-medium'}>
                          {row.retention}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'channel-analysis':
        return (
          <div className="space-y-4">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Channel</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Revenue</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Orders</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">AOV</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Conversion</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.slice(0, 20).map((row: any, index: number) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2 px-3 text-sm font-medium">{row.channel}</td>
                      <td className="py-2 px-3 text-sm text-right">£{row.revenue.toLocaleString()}</td>
                      <td className="py-2 px-3 text-sm text-right">{row.orders}</td>
                      <td className="py-2 px-3 text-sm text-right">£{row.aov.toFixed(2)}</td>
                      <td className="py-2 px-3 text-sm text-right">{row.conversion}%</td>
                      <td className="py-2 px-3 text-sm text-right">{row.sessions.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return <div>No data available</div>;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-background border border-border rounded-lg shadow-lg overflow-hidden"
          >
            <Card className="border-0 shadow-none">
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{data.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{data.subtitle}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Summary Stats */}
                <div className="flex items-center gap-6 mt-4">
                  <div>
                    <p className="text-2xl font-bold">{data.value}</p>
                    <div className={`flex items-center gap-1 text-sm ${
                      data.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {data.changeType === 'positive' ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      <span>{data.change}</span>
                    </div>
                  </div>
                  
                  {/* Active Filters */}
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {data.filters.dateRange}
                    </span>
                    {data.filters.segment && (
                      <Badge variant="secondary">{data.filters.segment}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 overflow-auto max-h-[60vh]">
                {renderContent()}
              </CardContent>
              
              <div className="border-t border-border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Data refreshed 2 minutes ago
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={onClose}>
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DrillThroughModal;