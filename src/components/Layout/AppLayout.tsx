import React from 'react'
import { RefreshCw } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

interface LayoutProps {
  children: React.ReactNode
  loading?: boolean
  loadingMessage?: string
}

const AppLayout: React.FC<LayoutProps> = ({ children, loading, loadingMessage = "Loading..." }) => {
  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-[240px]">
          <Header />
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-black mx-auto mb-4" />
              <p className="text-gray-600 font-light">{loadingMessage}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-[240px] overflow-auto">
        <Header />
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  )
}

export default AppLayout