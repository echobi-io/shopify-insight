import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { getCohortAnalysisData, getCohortRetentionData, CohortAnalysisResult } from '@/lib/fetchers/getCohortAnalysisData';
import { getSettings } from '@/lib/utils/settingsUtils';
import { Loader2, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';

interface CohortRetentionData {
  cohortMonth: string;
  cohortSize: number;
  retention: Record<string, number>;
}

interface CohortTableData {
  cohortMonth: string;
  cohortSize: number;
  months: number[];
}

const CohortAnalysis: React.FC = () => {
  const { user } = useAuth();
  const [cohortData, setCohortData] = useState<CohortAnalysisResult[]>([]);
  const [retentionData, setRetentionData] = useState<CohortRetentionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [merchantId, setMerchantId] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Get merchant ID from settings
        const settings = await getSettings();
        const currentMerchantId = settings?.merchant_id || '';
        setMerchantId(currentMerchantId);

        if (!currentMerchantId) {
          setError('Please configure your merchant ID in settings');
          return;
        }

        // Fetch cohort analysis data
        const [cohortResults, retentionResults] = await Promise.all([
          getCohortAnalysisData(currentMerchantId),
          getCohortRetentionData(currentMerchantId)
        ]);

        setCohortData(cohortResults);
        setRetentionData(retentionResults);

      } catch (err) {
        console.error('Error fetching cohort data:', err);
        setError('Failed to load cohort analysis data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // Prepare data for revenue cohort chart
  const prepareRevenueChartData = () => {
    const cohortYears = [...new Set(cohortData.map(d => d.cohortMonth))].sort();
    const maxMonthIndex = Math.max(...cohortData.map(d => d.monthIndex), 1);
    
    const chartData = [];
    for (let monthIndex = 1; monthIndex <= Math.min(maxMonthIndex, 12); monthIndex++) {
      const dataPoint: any = { monthIndex: `Month ${monthIndex}` };
      
      cohortYears.forEach(cohortYear => {
        const cohortPoint = cohortData.find(d => d.cohortMonth === cohortYear && d.monthIndex === monthIndex);
        dataPoint[cohortYear] = cohortPoint ? cohortPoint.avgIncome : 0;
      });
      
      chartData.push(dataPoint);
    }
    
    return chartData;
  };

  // Prepare data for retention heatmap
  const prepareRetentionTableData = (): CohortTableData[] => {
    return retentionData.map(cohort => ({
      cohortMonth: cohort.cohortMonth,
      cohortSize: cohort.cohortSize,
      months: Array.from({ length: 12 }, (_, i) => cohort.retention[`month_${i}`] || 0)
    }));
  };

  // Get color for retention rate
  const getRetentionColor = (rate: number): string => {
    if (rate >= 50) return 'bg-green-500';
    if (rate >= 30) return 'bg-yellow-500';
    if (rate >= 15) return 'bg-orange-500';
    if (rate > 0) return 'bg-red-500';
    return 'bg-gray-200';
  };

  // Calculate summary metrics
  const calculateSummaryMetrics = () => {
    if (cohortData.length === 0) return null;

    const cohorts = [...new Set(cohortData.map(d => d.cohortMonth))];
    const totalCustomers = retentionData.reduce((sum, cohort) => sum + cohort.cohortSize, 0);
    
    // Average revenue per customer in first month (now monthIndex === 1)
    const firstMonthRevenue = cohortData
      .filter(d => d.monthIndex === 1)
      .reduce((sum, d) => sum + d.avgIncome, 0) / cohorts.length;

    // Average revenue per customer after 6 months (now monthIndex === 6)
    const sixMonthRevenue = cohortData
      .filter(d => d.monthIndex === 6)
      .reduce((sum, d) => sum + d.avgIncome, 0) / cohorts.filter(c => 
        cohortData.some(d => d.cohortMonth === c && d.monthIndex === 6)
      ).length;

    // Average retention rate in month 1 (should be 100% now)
    const month1Retention = retentionData.length > 0 
      ? retentionData.reduce((sum, cohort) => sum + (cohort.retention.month_0 || 0), 0) / retentionData.length
      : 0;

    return {
      totalCohorts: cohorts.length,
      totalCustomers,
      avgFirstMonthRevenue: firstMonthRevenue,
      avgSixMonthRevenue: sixMonthRevenue,
      avgMonth1Retention: month1Retention
    };
  };

  const summaryMetrics = calculateSummaryMetrics();
  const revenueChartData = prepareRevenueChartData();
  const retentionTableData = prepareRetentionTableData();

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#00ffff', '#ff0000'];

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-50">
          <Sidebar activeSection="cohort-analysis" />
          <div className="flex-1 ml-[240px]">
            <Header />
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar activeSection="cohort-analysis" />
        <div className="flex-1 ml-[240px]">
          <Header />
          <div className="p-8 space-y-8 overflow-auto">
            <div>
              <h1 className="text-3xl font-light text-black mb-2">Cohort Analysis</h1>
              <p className="text-gray-600">
                Track customer behavior and revenue patterns across different signup cohorts
              </p>
            </div>

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <p className="text-red-600">{error}</p>
                </CardContent>
              </Card>
            )}

            {!error && summaryMetrics && (
              <>
                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Cohorts</p>
                          <p className="text-2xl font-bold text-black">{summaryMetrics.totalCohorts}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Customers</p>
                          <p className="text-2xl font-bold text-black">{summaryMetrics.totalCustomers.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Avg First Month Revenue</p>
                          <p className="text-2xl font-bold text-black">${summaryMetrics.avgFirstMonthRevenue.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Avg 6-Month Revenue</p>
                          <p className="text-2xl font-bold text-black">${summaryMetrics.avgSixMonthRevenue.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Avg Month 1 Retention</p>
                          <p className="text-2xl font-bold text-black">{summaryMetrics.avgMonth1Retention.toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Tabs defaultValue="revenue" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="revenue">Revenue Cohorts</TabsTrigger>
                    <TabsTrigger value="retention">Retention Analysis</TabsTrigger>
                  </TabsList>

                  <TabsContent value="revenue" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Cumulative Revenue per Customer by Cohort</CardTitle>
                        <CardDescription>
                          Average cumulative revenue generated per customer over time for each signup cohort
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {revenueChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={revenueChartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="monthIndex" />
                              <YAxis tickFormatter={(value) => `$${value}`} />
                              <Tooltip formatter={(value: any) => [`$${value}`, 'Avg Revenue']} />
                              <Legend />
                              {[...new Set(cohortData.map(d => d.cohortMonth))].sort().map((cohortMonth, index) => (
                                <Line
                                  key={cohortMonth}
                                  type="monotone"
                                  dataKey={cohortMonth}
                                  stroke={colors[index % colors.length]}
                                  strokeWidth={2}
                                  dot={{ r: 4 }}
                                />
                              ))}
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-64 text-gray-500">
                            No revenue data available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="retention" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Cohort Retention Heatmap</CardTitle>
                        <CardDescription>
                          Percentage of customers from each cohort who made purchases in subsequent months
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {retentionTableData.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr>
                                  <th className="border p-2 bg-gray-50 text-left font-medium">Cohort</th>
                                  <th className="border p-2 bg-gray-50 text-center font-medium">Size</th>
                                  {Array.from({ length: 12 }, (_, i) => (
                                    <th key={i} className="border p-2 bg-gray-50 text-center font-medium text-xs">
                                      M{i + 1}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {retentionTableData.map((cohort) => (
                                  <tr key={cohort.cohortMonth}>
                                    <td className="border p-2 font-medium">{cohort.cohortMonth}</td>
                                    <td className="border p-2 text-center">{cohort.cohortSize}</td>
                                    {cohort.months.map((rate, monthIndex) => (
                                      <td key={monthIndex} className="border p-1">
                                        <div
                                          className={`w-full h-8 flex items-center justify-center text-xs font-medium text-white rounded ${getRetentionColor(rate)}`}
                                        >
                                          {rate > 0 ? `${rate.toFixed(0)}%` : '-'}
                                        </div>
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="mt-4 flex items-center space-x-4 text-xs">
                              <span>Retention Rate:</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-green-500 rounded"></div>
                                <span>50%+</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                                <span>30-49%</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                                <span>15-29%</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-red-500 rounded"></div>
                                <span>1-14%</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                <span>0%</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-64 text-gray-500">
                            No retention data available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}

            {!error && !summaryMetrics && (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="space-y-4">
                    <Users className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">No Cohort Data Available</h3>
                      <p className="text-gray-500 mt-2">
                        {!merchantId 
                          ? 'Please configure your merchant ID in settings to view cohort analysis.'
                          : 'No customer or order data found for cohort analysis.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CohortAnalysis;