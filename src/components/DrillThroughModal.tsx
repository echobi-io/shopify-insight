import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DrillThroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

const DrillThroughModal: React.FC<DrillThroughModalProps> = ({ isOpen, onClose, data }) => {
  if (!data) return null;

  const renderContent = () => {
    switch (data.type) {
      case 'revenue':
      case 'orders':
      case 'customers':
        return (
          <div className="space-y-4">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {data.type === 'revenue' && (
                      <>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Order ID</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Customer</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Product</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Value</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                      </>
                    )}
                    {data.type === 'orders' && (
                      <>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
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
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Orders</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">LTV</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Segment</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.data.slice(0, 20).map((row: any, index: number) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-muted/50">
                      {data.type === 'revenue' && (
                        <>
                          <td className="py-2 px-3 text-sm">{row.date}</td>
                          <td className="py-2 px-3 text-sm font-mono">{row.order_id}</td>
                          <td className="py-2 px-3 text-sm">{row.customer}</td>
                          <td className="py-2 px-3 text-sm">{row.product}</td>
                          <td className="py-2 px-3 text-sm text-right">£{row.value}</td>
                          <td className="py-2 px-3 text-sm">
                            <Badge variant={row.status === 'completed' ? 'default' : 'secondary'}>
                              {row.status}
                            </Badge>
                          </td>
                        </>
                      )}
                      {data.type === 'orders' && (
                        <>
                          <td className="py-2 px-3 text-sm">{row.date}</td>
                          <td className="py-2 px-3 text-sm font-mono">{row.order_id}</td>
                          <td className="py-2 px-3 text-sm">{row.customer}</td>
                          <td className="py-2 px-3 text-sm text-right">{row.items}</td>
                          <td className="py-2 px-3 text-sm text-right">£{row.value}</td>
                          <td className="py-2 px-3 text-sm">
                            <Badge variant={row.status === 'completed' ? 'default' : 'secondary'}>
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
                          <td className="py-2 px-3 text-sm text-right">{row.orders}</td>
                          <td className="py-2 px-3 text-sm text-right">£{row.ltv}</td>
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
            {data.data.length > 20 && (
              <p className="text-sm text-muted-foreground text-center">
                Showing 20 of {data.data.length} results
              </p>
            )}
          </div>
        );

      case 'aov':
        return (
          <div className="space-y-4">
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
            <div className="grid grid-cols-2 gap-4">
              {data.data.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">{item.range}</span>
                  <span className="text-sm text-muted-foreground">{item.count} orders</span>
                </div>
              ))}
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