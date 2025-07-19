import React, { useState, useCallback, useRef } from 'react'
import { 
  Download, 
  Filter, 
  Calendar, 
  BarChart3, 
  Table, 
  RefreshCw,
  Save,
  Share,
  Eye,
  EyeOff,
  Grid3X3,
  FileText,
  Image,
  FileSpreadsheet,
  ChevronDown,
  Settings,
  Edit,
  TrendingUp,
  Activity,
  Scatter
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, AreaChart, Area, ScatterChart, Scatter } from 'recharts'
import PivotTable from '@/components/PivotTable'
import { 
  exportToCSV, 
  exportToExcel, 
  exportToPDF, 
  exportToJSON, 
  exportPivotTableToCSV,
  exportChartAsImage,
  createExportSummary
} from '@/lib/utils/exportUtils'

interface ReportFilter {
  id: string
  label: string
  type: 'select' | 'date' | 'daterange' | 'text' | 'number'
  options?: { value: string; label: string }[]
  value?: any
  placeholder?: string
}

interface ReportColumn {
  key: string
  label: string
  type: 'text' | 'number' | 'currency' | 'percentage' | 'date'
  sortable?: boolean
  width?: string
}

interface ReportData {
  [key: string]: any
}

interface ReportVisualization {
  type: 'bar' | 'line' | 'area' | 'scatter'
  title: string
  subtitle?: string
  dataKey: string
  xAxisKey: string
  yAxisKey?: string
  xAxisTitle?: string
  yAxisTitle?: string
}

interface ReportEngineProps {
  title: string
  description: string
  filters: ReportFilter[]
  columns: ReportColumn[]
  data: ReportData[]
  loading?: boolean
  visualizations?: ReportVisualization[]
  onFilterChange: (filterId: string, value: any) => void
  onRefresh: () => void
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void // Made optional since we'll handle internally
  onSave?: (reportName: string) => void
}

const ReportEngine: React.FC<ReportEngineProps> = ({
  title,
  description,
  filters,
  columns,
  data,
  loading = false,
  visualizations = [],
  onFilterChange,
  onRefresh,
  onExport,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState('table')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns.map(col => col.key))
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [reportName, setReportName] = useState('')
  const chartRefs = useRef<(HTMLDivElement | null)[]>([])
  
  // Chart customization state
  const [chartCustomizations, setChartCustomizations] = useState<{[key: number]: ReportVisualization}>({})
  const [editingChart, setEditingChart] = useState<number | null>(null)

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnKey) 
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    )
  }

  const formatValue = (value: any, type: string) => {
    if (value === null || value === undefined) return '-'
    
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(value)
      case 'percentage':
        return `${(value * 100).toFixed(2)}%`
      case 'number':
        return new Intl.NumberFormat('en-US').format(value)
      case 'date':
        return new Date(value).toLocaleDateString()
      default:
        return value
    }
  }

  const filteredAndSortedData = React.useMemo(() => {
    console.log('🔍 ReportEngine filtering - Input data:', data)
    console.log('🔍 ReportEngine filtering - Filters:', filters)
    
    let filteredData = [...data]
    
    // Get the data field names from the first row to know which filters to apply
    const dataFields = data.length > 0 ? Object.keys(data[0]) : []
    console.log('🔍 Available data fields:', dataFields)
    
    // Apply filters only for fields that exist in the data
    filters.forEach(filter => {
      console.log(`🔍 Processing filter: ${filter.id} = ${filter.value}`)
      
      // Skip filters that don't correspond to data fields (like dateRange, which is handled by parent)
      if (!dataFields.includes(filter.id)) {
        console.log(`🔍 Skipping filter ${filter.id} - not a data field`)
        return
      }
      
      if (filter.value && filter.value !== 'all' && filter.value !== '') {
        const beforeCount = filteredData.length
        
        filteredData = filteredData.filter(row => {
          const rowValue = row[filter.id]
          
          switch (filter.type) {
            case 'select':
              return rowValue === filter.value
            case 'text':
              return rowValue && rowValue.toString().toLowerCase().includes(filter.value.toLowerCase())
            case 'number':
              const numValue = parseFloat(filter.value)
              const rowNumValue = parseFloat(rowValue)
              if (filter.id.includes('min')) {
                return rowNumValue >= numValue
              } else if (filter.id.includes('max')) {
                return rowNumValue <= numValue
              }
              return rowNumValue === numValue
            case 'date':
              return rowValue === filter.value
            case 'daterange':
              // Handle date range filtering if needed
              return true
            default:
              return true
          }
        })
        
        console.log(`🔍 Filter ${filter.id}: ${beforeCount} → ${filteredData.length} rows`)
      }
    })
    
    console.log('🔍 After filtering:', filteredData.length, 'rows')
    
    // Apply sorting
    if (!sortColumn) {
      console.log('✅ Final filtered data:', filteredData)
      return filteredData
    }
    
    const sortedData = filteredData.sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]
      
      if (aVal === bVal) return 0
      
      const comparison = aVal < bVal ? -1 : 1
      return sortDirection === 'asc' ? comparison : -comparison
    })
    
    console.log('✅ Final sorted data:', sortedData)
    return sortedData
  }, [data, filters, sortColumn, sortDirection])

  const handleSaveReport = () => {
    if (onSave && reportName.trim()) {
      onSave(reportName.trim())
      setSaveDialogOpen(false)
      setReportName('')
    }
  }

  // Enhanced export handlers
  const handleEnhancedExport = (format: 'csv' | 'excel' | 'pdf' | 'json') => {
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`
    
    // Get visible columns for export
    const visibleColumnsData = columns.filter(col => visibleColumns.includes(col.key))
    
    switch (format) {
      case 'csv':
        exportToCSV(filteredAndSortedData, visibleColumnsData, filename, { includeMetadata: true })
        break
      case 'excel':
        exportToExcel(filteredAndSortedData, visibleColumnsData, filename)
        break
      case 'pdf':
        exportToPDF(filteredAndSortedData, visibleColumnsData, filename, title)
        break
      case 'json':
        exportToJSON(filteredAndSortedData, filename, { includeMetadata: true })
        break
    }
  }

  const handlePivotExport = () => {
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-pivot-${timestamp}`
    exportPivotTableToCSV(filteredAndSortedData, filename)
  }

  const handleChartExport = (chartIndex: number, format: 'png' | 'svg') => {
    const chartElement = chartRefs.current[chartIndex]
    if (chartElement && visualizations[chartIndex]) {
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${visualizations[chartIndex].title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`
      exportChartAsImage(chartElement, filename, format)
    }
  }

  const handleSummaryExport = () => {
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-summary-${timestamp}`
    const summary = createExportSummary(filteredAndSortedData, columns, filters)
    
    const blob = new Blob([summary], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Chart customization functions
  const getChartConfig = (index: number): ReportVisualization => {
    return chartCustomizations[index] || visualizations[index]
  }

  const updateChartConfig = (index: number, updates: Partial<ReportVisualization>) => {
    setChartCustomizations(prev => ({
      ...prev,
      [index]: { ...getChartConfig(index), ...updates }
    }))
  }

  const renderChart = (chartConfig: ReportVisualization, data: any[]) => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 60 }
    }

    switch (chartConfig.type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={chartConfig.xAxisKey} 
              label={{ value: chartConfig.xAxisTitle || chartConfig.xAxisKey, position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              label={{ value: chartConfig.yAxisTitle || chartConfig.dataKey, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip />
            <Bar dataKey={chartConfig.dataKey} fill="#0ea5e9" />
          </BarChart>
        )
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={chartConfig.xAxisKey}
              label={{ value: chartConfig.xAxisTitle || chartConfig.xAxisKey, position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              label={{ value: chartConfig.yAxisTitle || chartConfig.dataKey, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip />
            <Line type="monotone" dataKey={chartConfig.dataKey} stroke="#0ea5e9" strokeWidth={2} />
          </LineChart>
        )
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={chartConfig.xAxisKey}
              label={{ value: chartConfig.xAxisTitle || chartConfig.xAxisKey, position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              label={{ value: chartConfig.yAxisTitle || chartConfig.dataKey, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip />
            <Area type="monotone" dataKey={chartConfig.dataKey} stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
          </AreaChart>
        )
      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={chartConfig.xAxisKey}
              label={{ value: chartConfig.xAxisTitle || chartConfig.xAxisKey, position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              dataKey={chartConfig.yAxisKey || chartConfig.dataKey}
              label={{ value: chartConfig.yAxisTitle || chartConfig.dataKey, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip />
            <Scatter dataKey={chartConfig.dataKey} fill="#0ea5e9" />
          </ScatterChart>
        )
      default:
        return null
    }
  }

  const renderFilter = (filter: ReportFilter) => {
    switch (filter.type) {
      case 'select':
        return (
          <Select 
            value={filter.value || ''} 
            onValueChange={(value) => onFilterChange(filter.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={filter.placeholder || `Select ${filter.label}`} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'date':
        return (
          <Input
            type="date"
            value={filter.value || ''}
            onChange={(e) => onFilterChange(filter.id, e.target.value)}
          />
        )
      case 'text':
        return (
          <Input
            type="text"
            placeholder={filter.placeholder || `Enter ${filter.label}`}
            value={filter.value || ''}
            onChange={(e) => onFilterChange(filter.id, e.target.value)}
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            placeholder={filter.placeholder || `Enter ${filter.label}`}
            value={filter.value || ''}
            onChange={(e) => onFilterChange(filter.id, e.target.value)}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black">{title}</h1>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {onSave && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSaveDialogOpen(true)}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {filters.length > 0 && (
        <Card className="card-minimal">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-black flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filters.map((filter) => (
                <div key={filter.id} className="space-y-2">
                  <Label htmlFor={filter.id} className="text-sm font-medium">
                    {filter.label}
                  </Label>
                  {renderFilter(filter)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}



      {/* Main Content */}
      <Card className="card-minimal">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="table">
                  <Table className="w-4 h-4 mr-2" />
                  Table View
                </TabsTrigger>
                <TabsTrigger value="pivot">
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  Pivot Table
                </TabsTrigger>
                {visualizations.length > 0 && (
                  <TabsTrigger value="charts">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Charts
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
            
            <div className="flex items-center space-x-2">
              {/* Column Visibility */}
              <div className="flex items-center space-x-1">
                {columns.map((column) => (
                  <Button
                    key={column.key}
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleColumnVisibility(column.key)}
                    className={`h-8 px-2 ${visibleColumns.includes(column.key) ? 'bg-blue-50 text-blue-600' : ''}`}
                  >
                    {visibleColumns.includes(column.key) ? (
                      <Eye className="w-3 h-3 mr-1" />
                    ) : (
                      <EyeOff className="w-3 h-3 mr-1" />
                    )}
                    {column.label}
                  </Button>
                ))}
              </div>
              
              <Separator orientation="vertical" className="h-6" />
              
              {/* Enhanced Export Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {/* Table Export Options */}
                  {activeTab === 'table' && (
                    <>
                      <DropdownMenuItem onClick={() => handleEnhancedExport('csv')}>
                        <FileText className="w-4 h-4 mr-2" />
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEnhancedExport('excel')}>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Export as Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEnhancedExport('pdf')}>
                        <FileText className="w-4 h-4 mr-2" />
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEnhancedExport('json')}>
                        <FileText className="w-4 h-4 mr-2" />
                        Export as JSON
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSummaryExport}>
                        <FileText className="w-4 h-4 mr-2" />
                        Export Summary
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {/* Pivot Table Export Options */}
                  {activeTab === 'pivot' && (
                    <>
                      <DropdownMenuItem onClick={handlePivotExport}>
                        <FileText className="w-4 h-4 mr-2" />
                        Export Pivot as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEnhancedExport('json')}>
                        <FileText className="w-4 h-4 mr-2" />
                        Export as JSON
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {/* Chart Export Options */}
                  {activeTab === 'charts' && visualizations.length > 0 && (
                    <>
                      {visualizations.map((viz, index) => (
                        <div key={index}>
                          <DropdownMenuItem onClick={() => handleChartExport(index, 'svg')}>
                            <Image className="w-4 h-4 mr-2" />
                            Export "{viz.title}" as SVG
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleChartExport(index, 'png')}>
                            <Image className="w-4 h-4 mr-2" />
                            Export "{viz.title}" as PNG
                          </DropdownMenuItem>
                        </div>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEnhancedExport('json')}>
                        <FileText className="w-4 h-4 mr-2" />
                        Export Chart Data as JSON
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="table" className="mt-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {columns
                        .filter(col => visibleColumns.includes(col.key))
                        .map((column) => (
                        <th
                          key={column.key}
                          className={`text-left p-3 font-medium text-gray-900 ${
                            column.sortable ? 'cursor-pointer hover:bg-gray-50' : ''
                          }`}
                          onClick={() => column.sortable && handleSort(column.key)}
                          style={{ width: column.width }}
                        >
                          <div className="flex items-center space-x-1">
                            <span>{column.label}</span>
                            {column.sortable && sortColumn === column.key && (
                              <span className="text-blue-600">
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={visibleColumns.length} className="text-center p-8">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                          <p className="text-gray-500">Loading data...</p>
                        </td>
                      </tr>
                    ) : filteredAndSortedData.length === 0 ? (
                      <tr>
                        <td colSpan={visibleColumns.length} className="text-center p-8">
                          <p className="text-gray-500">No data available</p>
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedData.map((row, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          {columns
                            .filter(col => visibleColumns.includes(col.key))
                            .map((column) => (
                            <td key={column.key} className="p-3 text-sm">
                              {formatValue(row[column.key], column.type)}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="pivot" className="mt-0">
              {loading ? (
                <div className="text-center p-8">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-gray-500">Loading data...</p>
                </div>
              ) : (
                <PivotTable 
                  data={filteredAndSortedData} 
                  columns={columns} 
                />
              )}
            </TabsContent>
            
            {visualizations.length > 0 && (
              <TabsContent value="charts" className="mt-0">
                <div className="space-y-8">
                  {visualizations.map((viz, index) => {
                    const chartConfig = getChartConfig(index)
                    return (
                      <Card key={index} className="p-6">
                        <div className="space-y-6">
                          {/* Chart Header with Controls */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center space-x-3">
                                <h3 className="text-xl font-semibold text-black">
                                  {chartConfig.title}
                                </h3>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Customize Chart</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label>Chart Type</Label>
                                        <Select
                                          value={chartConfig.type}
                                          onValueChange={(value: 'bar' | 'line' | 'area' | 'scatter') => 
                                            updateChartConfig(index, { type: value })
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="bar">
                                              <div className="flex items-center space-x-2">
                                                <BarChart3 className="w-4 h-4" />
                                                <span>Bar Chart</span>
                                              </div>
                                            </SelectItem>
                                            <SelectItem value="line">
                                              <div className="flex items-center space-x-2">
                                                <TrendingUp className="w-4 h-4" />
                                                <span>Line Chart</span>
                                              </div>
                                            </SelectItem>
                                            <SelectItem value="area">
                                              <div className="flex items-center space-x-2">
                                                <Activity className="w-4 h-4" />
                                                <span>Area Chart</span>
                                              </div>
                                            </SelectItem>
                                            <SelectItem value="scatter">
                                              <div className="flex items-center space-x-2">
                                                <Scatter className="w-4 h-4" />
                                                <span>Scatter Plot</span>
                                              </div>
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      
                                      <div>
                                        <Label>Chart Title</Label>
                                        <Input
                                          value={chartConfig.title}
                                          onChange={(e) => updateChartConfig(index, { title: e.target.value })}
                                          placeholder="Enter chart title"
                                        />
                                      </div>
                                      
                                      <div>
                                        <Label>Subtitle (optional)</Label>
                                        <Input
                                          value={chartConfig.subtitle || ''}
                                          onChange={(e) => updateChartConfig(index, { subtitle: e.target.value })}
                                          placeholder="Enter chart subtitle"
                                        />
                                      </div>
                                      
                                      <div>
                                        <Label>X-Axis Title</Label>
                                        <Input
                                          value={chartConfig.xAxisTitle || ''}
                                          onChange={(e) => updateChartConfig(index, { xAxisTitle: e.target.value })}
                                          placeholder="Enter X-axis title"
                                        />
                                      </div>
                                      
                                      <div>
                                        <Label>Y-Axis Title</Label>
                                        <Input
                                          value={chartConfig.yAxisTitle || ''}
                                          onChange={(e) => updateChartConfig(index, { yAxisTitle: e.target.value })}
                                          placeholder="Enter Y-axis title"
                                        />
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                              {chartConfig.subtitle && (
                                <p className="text-sm text-gray-600">{chartConfig.subtitle}</p>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {/* Chart Type Quick Switch */}
                              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                                <Button
                                  variant={chartConfig.type === 'bar' ? 'default' : 'ghost'}
                                  size="sm"
                                  onClick={() => updateChartConfig(index, { type: 'bar' })}
                                  className="h-8 w-8 p-0"
                                >
                                  <BarChart3 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant={chartConfig.type === 'line' ? 'default' : 'ghost'}
                                  size="sm"
                                  onClick={() => updateChartConfig(index, { type: 'line' })}
                                  className="h-8 w-8 p-0"
                                >
                                  <TrendingUp className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant={chartConfig.type === 'area' ? 'default' : 'ghost'}
                                  size="sm"
                                  onClick={() => updateChartConfig(index, { type: 'area' })}
                                  className="h-8 w-8 p-0"
                                >
                                  <Activity className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant={chartConfig.type === 'scatter' ? 'default' : 'ghost'}
                                  size="sm"
                                  onClick={() => updateChartConfig(index, { type: 'scatter' })}
                                  className="h-8 w-8 p-0"
                                >
                                  <Scatter className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleChartExport(index, 'svg')}>
                                    <Image className="w-4 h-4 mr-2" />
                                    Export as SVG
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleChartExport(index, 'png')}>
                                    <Image className="w-4 h-4 mr-2" />
                                    Export as PNG
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          
                          {/* Chart Container */}
                          <div 
                            className="h-96 w-full"
                            ref={(el) => (chartRefs.current[index] = el)}
                          >
                            <ResponsiveContainer width="100%" height="100%">
                              {renderChart(chartConfig, filteredAndSortedData)}
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Save Dialog */}
      {saveDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Save Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reportName">Report Name</Label>
                <Input
                  id="reportName"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Enter report name"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSaveDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveReport}
                  disabled={!reportName.trim()}
                >
                  Save Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ReportEngine