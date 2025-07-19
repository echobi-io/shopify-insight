export type ExportDataType = 'revenue' | 'orders' | 'customers' | 'products' | 'segments' | 'channels' | 'comparison'
export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json' | 'png' | 'svg'
export type ExportOutputType = 'table' | 'pivot' | 'chart' | 'summary'

interface ExportOptions {
  format: ExportFormat
  outputType: ExportOutputType
  filename?: string
  includeFilters?: boolean
  includeMetadata?: boolean
  chartConfig?: {
    width?: number
    height?: number
    title?: string
  }
}

interface ReportColumn {
  key: string
  label: string
  type: 'text' | 'number' | 'currency' | 'percentage' | 'date'
}

export function formatDataForExport(data: any[], type: ExportDataType) {
  switch (type) {
    case 'revenue':
      return data.map(item => ({
        Date: item.date || item.order_id || item.customer,
        Revenue: item.revenue || item.value,
        Orders: item.orders,
        Status: item.status
      }))
    
    case 'orders':
      return data.map(item => ({
        'Order ID': item.order_id,
        Date: item.date,
        Customer: item.customer,
        Items: item.items,
        Value: item.value,
        Status: item.status
      }))
    
    case 'customers':
      return data.map(item => ({
        Name: item.name,
        Email: item.email,
        'Signup Date': item.signup_date,
        Orders: item.orders,
        LTV: item.ltv,
        Segment: item.segment
      }))
    
    case 'products':
      return data.map(item => ({
        Product: item.product,
        'Units Sold': item.unitsSold,
        Revenue: item.revenue,
        AOV: item.aov,
        Refunds: item.refunds,
        'Repeat Order Rate': item.repeatOrderRate
      }))
    
    case 'segments':
      return data.map(item => ({
        Segment: item.segment,
        Revenue: item.revenue,
        Orders: item.orders,
        Percentage: item.percentage
      }))
    
    case 'channels':
      return data.map(item => ({
        Channel: item.channel,
        Revenue: item.revenue,
        Percentage: item.percentage
      }))
    
    case 'comparison':
      return data.map(item => ({
        Metric: item.metric,
        'This Month': item.thisMonth,
        'Last Month': item.lastMonth,
        'Delta %': item.deltaPercent,
        'YoY %': item.yoyPercent
      }))
    
    default:
      return data
  }
}

export function formatValueForExport(value: any, type: string): string {
  if (value === null || value === undefined) return ''
  
  switch (type) {
    case 'currency':
      return typeof value === 'number' ? value.toFixed(2) : String(value)
    case 'percentage':
      return typeof value === 'number' ? (value * 100).toFixed(2) + '%' : String(value)
    case 'number':
      return typeof value === 'number' ? value.toString() : String(value)
    case 'date':
      return value instanceof Date ? value.toISOString().split('T')[0] : String(value)
    default:
      return String(value)
  }
}

export function exportToCSV(data: any[], columns: ReportColumn[], filename: string, options?: { includeMetadata?: boolean }) {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  const headers = columns.map(col => col.label)
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      columns.map(col => {
        const value = formatValueForExport(row[col.key], col.type)
        // Escape commas and quotes in CSV
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ]

  // Add metadata if requested
  if (options?.includeMetadata) {
    csvRows.unshift(
      `# Export generated on: ${new Date().toISOString()}`,
      `# Total records: ${data.length}`,
      `# Columns: ${columns.length}`,
      ''
    )
  }

  const csvContent = csvRows.join('\n')
  downloadFile(csvContent, `${filename}.csv`, 'text/csv')
}

export function exportToExcel(data: any[], columns: ReportColumn[], filename: string) {
  // For a full Excel export, you'd typically use a library like xlsx
  // For now, we'll create a more structured CSV that Excel can handle well
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  const headers = columns.map(col => col.label)
  const excelRows = [
    headers.join('\t'), // Use tabs for better Excel compatibility
    ...data.map(row => 
      columns.map(col => {
        const value = formatValueForExport(row[col.key], col.type)
        return value.replace(/\t/g, ' ') // Replace tabs with spaces
      }).join('\t')
    )
  ]

  const excelContent = excelRows.join('\n')
  downloadFile(excelContent, `${filename}.xls`, 'application/vnd.ms-excel')
}

export function exportToPDF(data: any[], columns: ReportColumn[], filename: string, title?: string) {
  // For a full PDF export, you'd typically use a library like jsPDF
  // For now, we'll create an HTML version that can be printed to PDF
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title || 'Report'}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        tr:nth-child(even) { background-color: #f8f9fa; }
        .metadata { color: #666; font-size: 12px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>${title || 'Report'}</h1>
      <div class="metadata">
        Generated on: ${new Date().toLocaleString()}<br>
        Total records: ${data.length}
      </div>
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${columns.map(col => `<td>${formatValueForExport(row[col.key], col.type)}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `

  const blob = new Blob([htmlContent], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  
  // Open in new window for printing to PDF
  const printWindow = window.open(url, '_blank')
  if (printWindow) {
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }
  
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportToJSON(data: any[], filename: string, options?: { includeMetadata?: boolean }) {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  const exportData = options?.includeMetadata ? {
    metadata: {
      exportDate: new Date().toISOString(),
      totalRecords: data.length,
      exportType: 'JSON'
    },
    data: data
  } : data

  const jsonContent = JSON.stringify(exportData, null, 2)
  downloadFile(jsonContent, `${filename}.json`, 'application/json')
}

export function exportPivotTableToCSV(pivotData: any[], filename: string) {
  if (!pivotData || pivotData.length === 0) {
    console.warn('No pivot data to export')
    return
  }

  // Convert pivot table structure to CSV
  const headers = Object.keys(pivotData[0])
  const csvContent = [
    headers.join(','),
    ...pivotData.map(row => 
      headers.map(header => {
        const value = row[header]
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value || ''
      }).join(',')
    )
  ].join('\n')

  downloadFile(csvContent, `${filename}-pivot.csv`, 'text/csv')
}

export function exportChartAsImage(chartElement: HTMLElement, filename: string, format: 'png' | 'svg' = 'png') {
  // For chart export, you'd typically use libraries like html2canvas or svg export
  // This is a placeholder implementation
  console.log(`Exporting chart as ${format}...`)
  
  if (format === 'svg') {
    // For SVG charts, you could extract the SVG content directly
    const svgElement = chartElement.querySelector('svg')
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  } else {
    // For PNG, you'd use html2canvas or similar
    alert('PNG chart export requires additional setup with html2canvas library')
  }
}

export function createExportSummary(data: any[], columns: ReportColumn[], filters?: any[]): string {
  const summary = {
    exportDate: new Date().toISOString(),
    totalRecords: data.length,
    columns: columns.length,
    columnNames: columns.map(col => col.label),
    appliedFilters: filters?.filter(f => f.value && f.value !== 'all' && f.value !== '').map(f => ({
      label: f.label,
      value: f.value
    })) || [],
    dataTypes: columns.reduce((acc, col) => {
      acc[col.label] = col.type
      return acc
    }, {} as Record<string, string>)
  }

  return JSON.stringify(summary, null, 2)
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}