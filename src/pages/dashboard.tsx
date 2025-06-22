import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  ShoppingBag, 
  Target, 
  DollarSign,
  AlertTriangle,
  Brain,
  PieChart,
  Activity,
  Calendar,
  Filter,
  Download,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Eye,
  UserCheck,
  UserX,
  Package,
  CreditCard,
  Clock,
  Star
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Mock data for demonstration
const revenueData = [
  { month: 'Jan', revenue: 45000, orders: 320, customers: 280 },
  { month: 'Feb', revenue: 52000, orders: 380, customers: 340 },
  { month: 'Mar', revenue: 48000, orders: 350, customers: 310 },
  { month: 'Apr', revenue: 61000, orders: 420, customers: 380 },
  { month: 'May', revenue: 58000, orders: 400, customers: 360 },
  { month: 'Jun', revenue: 67000, orders: 480, customers: 420 },
];

const churnData = [
  { month: 'Jan', churnRate: 8.2, retained: 91.8 },
  { month: 'Feb', churnRate: 7.8, retained: 92.2 },
  { month: 'Mar', churnRate: 9.1, retained: 90.9 },
  { month: 'Apr', churnRate: 6.5, retained: 93.5 },
  { month: 'May', churnRate: 7.2, retained: 92.8 },
  { month: 'Jun', churnRate: 5.8, retained: 94.2 },
];

const customerSegments = [
  { name: 'Champions', value: 25, color: '#22c55e' },
  { name: 'Loyal Customers', value: 20, color: '#3b82f6' },
  { name: 'Potential Loyalists', value: 18, color: '#8b5cf6' },
  { name: 'At Risk', value: 15, color: '#f59e0b' },
  { name: 'Cannot Lose Them', value: 12, color: '#ef4444' },
  { name: 'Others', value: 10, color: '#6b7280' },
];

const topProducts = [
  { name: 'Premium Headphones', revenue: 12500, units: 85, trend: 'up' },
  { name: 'Wireless Earbuds', revenue: 9800, units: 120, trend: 'up' },
  { name: 'Smart Watch', revenue: 8200, units: 45, trend: 'down' },
  { name: 'Phone Case', revenue: 6500, units: 200, trend: 'up' },
  { name: 'Charging Cable', revenue: 4200, units: 150, trend: 'stable' },
];

const atRiskCustomers = [
  { name: 'Sarah Johnson', email: 'sarah@email.com', ltv: 1250, riskScore: 85, lastOrder: '45 days ago' },
  { name: 'Mike Chen', email: 'mike@email.com', ltv: 980, riskScore: 78, lastOrder: '38 days ago' },
  { name: 'Emma Davis', email: 'emma@email.com', ltv: 1450, riskScore: 72, lastOrder: '42 days ago' },
  { name: 'Alex Wilson', email: 'alex@email.com', ltv: 820, riskScore: 69, lastOrder: '35 days ago' },
];

export default function Dashboard() {
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const MetricCard = ({ title, value, change, icon: Icon, trend }: any) => (
    <motion.div variants={fadeInUp}>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              <div className="flex items-center mt-1">
                {trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {change}
                </span>
                <span className="text-sm text-muted-foreground ml-1">vs last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <motion.aside 
        className="w-64 border-r border-border bg-card"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ShopifyIQ</span>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'sales', label: 'Sales & Revenue', icon: TrendingUp },
              { id: 'customers', label: 'Customers', icon: Users },
              { id: 'churn', label: 'Churn & Retention', icon: UserX },
              { id: 'products', label: 'Product Insights', icon: Package },
              { id: 'predictions', label: 'AI Predictions', icon: Brain },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === item.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Pro Plan</p>
            </div>
          </div>
          <Button
            onClick={signOut}
            variant="ghost"
            size="sm"
            className="w-full justify-start"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <motion.header 
          className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Monitor your store's performance and growth</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Last 30 days
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Alerts
              </Button>
            </div>
          </div>
        </motion.header>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Revenue"
                  value="$67,000"
                  change="+15.3%"
                  icon={DollarSign}
                  trend="up"
                />
                <MetricCard
                  title="Orders"
                  value="480"
                  change="+20.1%"
                  icon={ShoppingBag}
                  trend="up"
                />
                <MetricCard
                  title="Customers"
                  value="420"
                  change="+16.7%"
                  icon={Users}
                  trend="up"
                />
                <MetricCard
                  title="Churn Rate"
                  value="5.8%"
                  change="-19.4%"
                  icon={UserX}
                  trend="up"
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <motion.div variants={fadeInUp}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                          <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Customer Segments */}
                <motion.div variants={fadeInUp}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Segments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={customerSegments}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                          >
                            {customerSegments.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* AI Insights */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="w-5 h-5 mr-2 text-primary" />
                      AI-Powered Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center mb-2">
                          <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                          <span className="font-medium text-green-800 dark:text-green-200">Revenue Opportunity</span>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Target "At Risk" customers with a 15% discount campaign. Potential revenue recovery: $8,400
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center mb-2">
                          <Target className="w-5 h-5 text-blue-600 mr-2" />
                          <span className="font-medium text-blue-800 dark:text-blue-200">Retention Focus</span>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Your retention rate improved by 19% this month. Continue current engagement strategies.
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center mb-2">
                          <Zap className="w-5 h-5 text-purple-600 mr-2" />
                          <span className="font-medium text-purple-800 dark:text-purple-200">Product Trend</span>
                        </div>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          Wireless Earbuds showing 45% growth. Consider expanding this product line.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* Churn & Retention Tab */}
          {activeTab === 'churn' && (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              {/* Churn Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  title="Current Churn Rate"
                  value="5.8%"
                  change="-19.4%"
                  icon={UserX}
                  trend="up"
                />
                <MetricCard
                  title="Customers at Risk"
                  value="24"
                  change="+8.3%"
                  icon={AlertTriangle}
                  trend="down"
                />
                <MetricCard
                  title="Retention Rate"
                  value="94.2%"
                  change="+1.4%"
                  icon={UserCheck}
                  trend="up"
                />
              </div>

              {/* Churn Trend Chart */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Churn Rate Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={churnData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="churnRate" stroke="#ef4444" strokeWidth={2} />
                        <Line type="monotone" dataKey="retained" stroke="#22c55e" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* At-Risk Customers */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                      High-Risk Customers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {atRiskCustomers.map((customer, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-sm text-muted-foreground">{customer.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <p className="text-sm font-medium">${customer.ltv} LTV</p>
                              <p className="text-xs text-muted-foreground">{customer.lastOrder}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-red-500 h-2 rounded-full" 
                                  style={{ width: `${customer.riskScore}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-red-500">{customer.riskScore}%</span>
                            </div>
                            <Button size="sm">
                              <Target className="w-4 h-4 mr-1" />
                              Target
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              {/* Product Performance */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topProducts.map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">{product.units} units sold</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-medium">${product.revenue.toLocaleString()}</p>
                              <div className="flex items-center">
                                {product.trend === 'up' ? (
                                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                ) : product.trend === 'down' ? (
                                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                                ) : (
                                  <Activity className="w-4 h-4 text-gray-500 mr-1" />
                                )}
                                <span className={`text-sm ${
                                  product.trend === 'up' ? 'text-green-500' : 
                                  product.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                                }`}>
                                  {product.trend === 'up' ? 'Growing' : 
                                   product.trend === 'down' ? 'Declining' : 'Stable'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* AI Predictions Tab */}
          {activeTab === 'predictions' && (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="w-5 h-5 mr-2 text-primary" />
                      AI Predictions & Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold">Revenue Forecast</h3>
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Next Month Prediction</span>
                            <Badge variant="secondary">95% Confidence</Badge>
                          </div>
                          <p className="text-2xl font-bold text-green-600">$72,500</p>
                          <p className="text-sm text-muted-foreground">+8.2% from current month</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="font-semibold">Churn Prediction</h3>
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Expected Churn Rate</span>
                            <Badge variant="secondary">92% Accuracy</Badge>
                          </div>
                          <p className="text-2xl font-bold text-orange-600">4.2%</p>
                          <p className="text-sm text-muted-foreground">-1.6% improvement expected</p>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <h3 className="font-semibold">Recommended Actions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-border rounded-lg">
                          <div className="flex items-center mb-2">
                            <Target className="w-5 h-5 text-blue-500 mr-2" />
                            <span className="font-medium">Retention Campaign</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Launch targeted email campaign for 24 at-risk customers
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-600">Est. Revenue: $8,400</span>
                            <Button size="sm">Launch</Button>
                          </div>
                        </div>

                        <div className="p-4 border border-border rounded-lg">
                          <div className="flex items-center mb-2">
                            <Package className="w-5 h-5 text-purple-500 mr-2" />
                            <span className="font-medium">Product Promotion</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Promote Wireless Earbuds to Champions segment
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-600">Est. Revenue: $12,200</span>
                            <Button size="sm">Create</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}