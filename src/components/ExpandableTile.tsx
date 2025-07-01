import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Maximize2, Download, FileText, Image, FileSpreadsheet } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface ExpandableTileProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  data?: any[] // For CSV export
  filename?: string
  expandedHeight?: string
}

const ExpandableTile: React.FC<ExpandableTileProps> = ({
  title,
  description,
  children,
  className = '',
  data = [],
  filename = 'export',
  expandedHeight = '80vh'
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const downloadCSV = () => {
    if (!data || data.length === 0) {
      console.warn('No data available for CSV export')
      return
    }

    try {
      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header]
            // Handle values that might contain commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          }).join(',')
        )
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading CSV:', error)
    }
  }

  const downloadPNG = async () => {
    if (!contentRef.current) return

    try {
      setIsDownloading(true)
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      })
      
      const link = document.createElement('a')
      link.download = `${filename}.png`
      link.href = canvas.toDataURL()
      link.click()
    } catch (error) {
      console.error('Error downloading PNG:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const downloadPDF = async () => {
    if (!contentRef.current) return

    try {
      setIsDownloading(true)
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      })
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`${filename}.pdf`)
    } catch (error) {
      console.error('Error downloading PDF:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <>
      <Card className={`card-minimal ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium text-black">{title}</CardTitle>
              {description && (
                <CardDescription className="font-light text-gray-600">
                  {description}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={isDownloading}
                    className="font-light"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={downloadPNG}>
                    <Image className="h-4 w-4 mr-2" />
                    Download PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Download PDF
                  </DropdownMenuItem>
                  {data.length > 0 && (
                    <DropdownMenuItem onClick={downloadCSV}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Download CSV
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsExpanded(true)}
                className="font-light"
              >
                <Maximize2 className="h-4 w-4 mr-1" />
                Expand
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent ref={contentRef}>
          {children}
        </CardContent>
      </Card>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-7xl w-full" style={{ height: expandedHeight }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-medium text-black">{title}</DialogTitle>
            {description && (
              <p className="text-gray-600 font-light">{description}</p>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-auto" ref={contentRef}>
            {children}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ExpandableTile