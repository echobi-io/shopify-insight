import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { 
  FileText, 
  Calendar, 
  Download, 
  Play, 
  Trash2, 
  Edit, 
  Copy,
  Clock,
  Filter,
  BarChart3
} from 'lucide-react'
import AppLayout from '@/components/Layout/AppLayout'
import PageHeader from '@/components/Layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SavedReport {
  id: string
  name: string
  description: string
  category: 'sales' | 'customers' | 'products' | 'cohorts'
  createdAt: string
  lastRun: string
  schedule?: 'daily' | 'weekly' | 'monthly' | null
  filters: Record<string, any>
  isScheduled: boolean
  fileSize: string
  recordCount: number
}

const SavedReportsPage: React.FC = () => {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [scheduleFilter, setScheduleFilter] = useState('')

  // Mock saved reports data
  const [savedReports] = useState<SavedReport[]>([
    {
      id: '1',
      name: 'Monthly Sales Summary',
      description: 'Comprehensive monthly sales performance report',
      category: 'sales',
      createdAt: '2024-01-15',
      lastRun: '2024-01-18',
      schedule: 'monthly',
      filters: { dateRange: 'thisMonth', channel: 'all' },
      isScheduled: true,
      fileSize: '2.3 MB',
      recordCount: 1250
    },
    {
      id: '2',
      name: 'Top Customer Analysis',
      description: 'Analysis of top 100 customers by lifetime value',
      category: 'customers',
      createdAt: '2024-01-10',
      lastRun: '2024-01-17',
      schedule: 'weekly',
      filters: { minLifetimeValue: '1000', segment: 'vip' },
      isScheduled: true,
      fileSize: '856 KB',
      recordCount: 100
    },
    {
      id: '3',
      name: 'Product Performance Q1',
      description: 'Quarterly product performance and inventory analysis',
      category: 'products',
      createdAt: '2024-01-05',
      lastRun: '2024-01-16',
      schedule: null,
      filters: { dateRange: 'thisQuarter', minSales: '50' },
      isScheduled: false,
      fileSize: '4.1 MB',
      recordCount: 2890
    },
    {
      id: '4',
      name: 'Cohort Retention Analysis',
      description: 'Customer retention analysis by monthly cohorts',
      category: 'cohorts',
      createdAt: '2024-01-12',
      lastRun: '2024-01-18',
      schedule: 'weekly',
      filters: { dateRange: 'last12months', cohortType: 'monthly' },
      isScheduled: true,
      fileSize: '1.7 MB',
      recordCount: 680
    }
  ])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sales':
        return <BarChart3 className="w-4 h-4" />
      case 'customers':
        return <FileText className="w-4 h-4" />
      case 'products':
        return <FileText className="w-4 h-4" />
      case 'cohorts':
        return <FileText className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sales':
        return 'bg-blue-50 text-blue-600'
      case 'customers':
        return 'bg-green-50 text-green-600'
      case 'products':
        return 'bg-purple-50 text-purple-600'
      case 'cohorts':
        return 'bg-orange-50 text-orange-600'
      default:
        return 'bg-gray-50 text-gray-600'
    }
  }

  const filteredReports = savedReports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || categoryFilter === 'all' || report.category === categoryFilter
    const matchesSchedule = !scheduleFilter || scheduleFilter === 'all' || 
                           (scheduleFilter === 'scheduled' && report.isScheduled) ||
                           (scheduleFilter === 'manual' && !report.isScheduled)
    
    return matchesSearch && matchesCategory && matchesSchedule
  })

  const handleRunReport = (reportId: string) => {
    const report = savedReports.find(r => r.id === reportId)
    if (report) {
      router.push(`/reports/${report.category}`)
    }
  }

  const handleEditReport = (reportId: string) => {
    console.log(`Editing report: ${reportId}`)
    alert('Edit functionality would be implemented here')
  }

  const handleDeleteReport = (reportId: string) => {
    console.log(`Deleting report: ${reportId}`)
    alert('Delete functionality would be implemented here')
  }

  const handleDuplicateReport = (reportId: string) => {
    console.log(`Duplicating report: ${reportId}`)
    alert('Duplicate functionality would be implemented here')
  }

  const handleDownloadReport = (reportId: string) => {
    console.log(`Downloading report: ${reportId}`)
    alert('Download functionality would be implemented here')
  }

  return (
    <AppLayout>
      <PageHeader
        title="Saved Reports"
        description="Manage and access your saved and scheduled reports"
        actions={
          <Button onClick={() => router.push('/reports')}>
            <FileText className="w-4 h-4 mr-2" />
            Create New Report
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-minimal">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Reports</p>
                  <p className="text-2xl font-semibold text-black">{savedReports.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-minimal">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Scheduled</p>
                  <p className="text-2xl font-semibold text-black">
                    {savedReports.filter(r => r.isScheduled).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-minimal">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Download className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Size</p>
                  <p className="text-2xl font-semibold text-black">8.9 MB</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-minimal">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Categories</p>
                  <p className="text-2xl font-semibold text-black">4</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="card-minimal">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-black flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filter Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="customers">Customers</SelectItem>
                    <SelectItem value="products">Products</SelectItem>
                    <SelectItem value="cohorts">Cohorts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={scheduleFilter} onValueChange={setScheduleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Reports" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reports</SelectItem>
                    <SelectItem value="scheduled">Scheduled Only</SelectItem>
                    <SelectItem value="manual">Manual Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredReports.length === 0 ? (
            <Card className="card-minimal">
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || categoryFilter || scheduleFilter 
                    ? 'Try adjusting your filters to see more reports.'
                    : 'You haven\'t saved any reports yet.'}
                </p>
                <Button onClick={() => router.push('/reports')}>
                  Create Your First Report
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredReports.map((report) => (
              <Card key={report.id} className="card-minimal hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`p-2 rounded-lg ${getCategoryColor(report.category)}`}>
                          {getCategoryIcon(report.category)}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-black">{report.name}</h3>
                          <p className="text-sm text-gray-600">{report.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-4">
                        <Badge variant="outline" className="capitalize">
                          {report.category}
                        </Badge>
                        {report.isScheduled && (
                          <Badge className="bg-green-50 text-green-600 border-green-200">
                            <Clock className="w-3 h-3 mr-1" />
                            {report.schedule}
                          </Badge>
                        )}
                        <span className="text-sm text-gray-500">
                          {report.recordCount.toLocaleString()} records
                        </span>
                        <span className="text-sm text-gray-500">
                          {report.fileSize}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Created: {new Date(report.createdAt).toLocaleDateString()}</span>
                        <span>Last run: {new Date(report.lastRun).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleRunReport(report.id)}
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Run
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadReport(report.id)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditReport(report.id)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicateReport(report.id)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteReport(report.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default SavedReportsPage