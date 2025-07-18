import React from 'react'
import { useRouter } from 'next/router'
import { 
  TrendingUp, 
  Users, 
  Package, 
  GitBranch,
  ArrowRight,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react'
import AppLayout from '@/components/Layout/AppLayout'
import PageHeader from '@/components/Layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const ReportsPage: React.FC = () => {
  const router = useRouter()

  const reportCategories = [
    {
      id: 'sales',
      title: 'Sales Reports',
      description: 'Revenue, orders, and sales performance analysis',
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'bg-blue-50 text-blue-600',
      reports: [
        'Sales Summary Report',
        'Revenue by Period',
        'Order Analysis',
        'Sales Channel Performance',
        'Geographic Sales Distribution'
      ]
    },
    {
      id: 'customers',
      title: 'Customer Reports',
      description: 'Customer behavior, segmentation, and lifetime value',
      icon: <Users className="w-8 h-8" />,
      color: 'bg-green-50 text-green-600',
      reports: [
        'Customer Summary Report',
        'Customer Segmentation',
        'Customer Lifetime Value',
        'New vs Returning Customers',
        'Customer Geographic Distribution'
      ]
    },
    {
      id: 'products',
      title: 'Product Reports',
      description: 'Product performance, inventory, and profitability',
      icon: <Package className="w-8 h-8" />,
      color: 'bg-purple-50 text-purple-600',
      reports: [
        'Product Performance Report',
        'Top Selling Products',
        'Product Returns Analysis',
        'Inventory Movement',
        'Product Profitability'
      ]
    },
    {
      id: 'cohorts',
      title: 'Cohort Reports',
      description: 'Customer cohort analysis and retention metrics',
      icon: <GitBranch className="w-8 h-8" />,
      color: 'bg-orange-50 text-orange-600',
      reports: [
        'Cohort Retention Analysis',
        'Revenue Cohort Analysis',
        'Customer Acquisition Cohorts',
        'Cohort Comparison Report',
        'Cohort LTV Analysis'
      ]
    }
  ]

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/reports/${categoryId}`)
  }

  return (
    <AppLayout>
      <PageHeader
        title="Reports"
        description="Generate detailed reports across sales, customers, products, and cohorts"
      />

      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-minimal">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Available Reports</p>
                  <p className="text-2xl font-semibold text-black">20</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-minimal">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <PieChart className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Report Categories</p>
                  <p className="text-2xl font-semibold text-black">4</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-minimal">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <LineChart className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Saved Reports</p>
                  <p className="text-2xl font-semibold text-black">0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-minimal">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Export Formats</p>
                  <p className="text-2xl font-semibold text-black">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportCategories.map((category) => (
            <Card key={category.id} className="card-minimal hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${category.color}`}>
                      {category.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-medium text-black">
                        {category.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {category.reports.slice(0, 3).map((report, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                      <span>{report}</span>
                    </div>
                  ))}
                  {category.reports.length > 3 && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                      <span>+{category.reports.length - 3} more reports</span>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={() => handleCategoryClick(category.id)}
                  className="w-full bg-black text-white hover:bg-gray-800"
                >
                  View Reports
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="card-minimal">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-black">Quick Actions</CardTitle>
            <p className="text-sm text-gray-600">Common reporting tasks and shortcuts</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="justify-start h-auto p-4"
                onClick={() => router.push('/saved-reports')}
              >
                <div className="text-left">
                  <div className="font-medium">View Saved Reports</div>
                  <div className="text-sm text-gray-500">Access your saved and scheduled reports</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start h-auto p-4"
                onClick={() => router.push('/reports/sales')}
              >
                <div className="text-left">
                  <div className="font-medium">Quick Sales Report</div>
                  <div className="text-sm text-gray-500">Generate a sales summary for today</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start h-auto p-4"
                onClick={() => router.push('/reports/customers')}
              >
                <div className="text-left">
                  <div className="font-medium">Customer Analysis</div>
                  <div className="text-sm text-gray-500">Analyze customer behavior and segments</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

export default ReportsPage