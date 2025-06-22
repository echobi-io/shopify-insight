export type ExportDataType = 'revenue' | 'orders' | 'customers' | 'products' | 'segments' | 'channels' | 'comparison'

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

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  downloadFile(csvContent, `${filename}.csv`, 'text/csv')
}

export function exportToJSON(data: any[], filename: string) {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  const jsonContent = JSON.stringify(data, null, 2)
  downloadFile(jsonContent, `${filename}.json`, 'application/json')
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