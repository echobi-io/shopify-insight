import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Package, Calendar, Info, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DrillThroughData {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  timeSeriesData?: Array<{
    date: string;
    value: number;
    label?: string;
  }>;
  topItems?: Array<{
    name: string;
    value: number;
    percentage?: number;
    trend?: 'up' | 'down' | 'stable';
  }>;
  insights?: Array<{
    type: 'positive' | 'negative' | 'neutral';
    message: string;
    impact?: 'high' | 'medium' | 'low';
  }>;
  breakdown?: Array<{
    category: string;
    value: number;
    color?: string;
  }>;
  recommendations?: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    impact: string;
  }>;
  explanation?: {
    calculation: string;
    factors: string[];
    interpretation: string;
  };
}

interface DrillThroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DrillThroughData;
  type: 'kpi' | 'chart' | 'list';
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

export const DrillThroughModal: React.FC<DrillThroughModalProps> = ({
  isOpen,
  onClose,
  data,
  type
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'down': return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'kpi' && <DollarSign className="h-5 w-5" />}
            {type === 'chart' && <LineChart className="h-5 w-5" />}
            {type === 'list' && <Package className="h-5 w-5" />}
            {data.title} - Detailed Analysis
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{data.value}</div>
                  {data.change !== undefined && (
                    <div className={`flex items-center gap-1 mt-2 ${data.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                      {data.changeType === 'increase' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span>{formatPercentage(data.change)} vs previous period</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {data.breakdown && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={data.breakdown}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ category, value }) => `${category}: ${formatValue(value)}`}
                        >
                          {data.breakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatValue(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {data.topItems && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Contributors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.topItems.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            {item.percentage && (
                              <div className="text-sm text-gray-500">{item.percentage.toFixed(1)}% of total</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{formatValue(item.value)}</span>
                          {item.trend && getTrendIcon(item.trend)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            {data.timeSeriesData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Historical Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={formatValue} />
                      <Tooltip 
                        formatter={(value) => [formatValue(Number(value)), 'Value']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {data.topItems && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.topItems.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis tickFormatter={formatValue} />
                      <Tooltip formatter={(value) => formatValue(Number(value))} />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            {data.insights && (
              <div className="space-y-3">
                {data.insights.map((insight, index) => (
                  <Card key={index} className={`border-l-4 ${getInsightColor(insight.type)}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <p className="text-sm">{insight.message}</p>
                        {insight.impact && (
                          <Badge variant="outline" className={getPriorityColor(insight.impact)}>
                            {insight.impact} impact
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {data.explanation && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    How This is Calculated
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Calculation Method:</h4>
                    <p className="text-sm text-gray-600">{data.explanation.calculation}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Key Factors:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {data.explanation.factors.map((factor, index) => (
                        <li key={index} className="text-sm text-gray-600">{factor}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Interpretation:</h4>
                    <p className="text-sm text-gray-600">{data.explanation.interpretation}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            {data.recommendations && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Recommended Actions</h3>
                {data.recommendations.map((rec, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority} priority
                        </Badge>
                      </div>
                      <h4 className="font-semibold mb-2">{rec.action}</h4>
                      <p className="text-sm text-gray-600">{rec.impact}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-800">Next Steps</h4>
                </div>
                <p className="text-sm text-blue-700">
                  Review the trends and insights above to identify opportunities for improvement. 
                  Focus on high-priority recommendations first, and monitor the impact of any changes you implement.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};