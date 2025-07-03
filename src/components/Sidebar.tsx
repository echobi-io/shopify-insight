import React from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

interface SidebarProps {
  activeSection?: string
  onSectionChange?: (section: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection = 'dashboard', onSectionChange }) => {
  const router = useRouter()

  const sidebarItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard'
    },
    {
      id: 'sales-analysis',
      label: 'Sales Analysis',
      href: '/sales-analysis'
    },
    {
      id: 'customer-insights',
      label: 'Customer Insights',
      href: '/customer-insights'
    },
    {
      id: 'product-insights',
      label: 'Product Insights',
      href: '/product-insights'
    },
    {
      id: 'churn-analytics',
      label: 'Churn Analytics',
      href: '/churn-analytics'
    },
    {
      id: 'churn-predictions',
      label: 'Churn Predictions',
      href: '/churn-predictions'
    },
    {
      id: 'cohort-analysis',
      label: 'Cohort Analysis',
      href: '/cohort-analysis'
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/settings'
    }
  ]

  const handleItemClick = (item: typeof sidebarItems[0]) => {
    router.push(item.href)
  }

  const getCurrentSection = () => {
    const path = router.pathname
    if (path === '/dashboard') return 'dashboard'
    if (path === '/sales-analysis') return 'sales-analysis'
    if (path === '/customer-insights') return 'customer-insights'
    if (path === '/product-insights') return 'product-insights'
    if (path === '/churn-analytics') return 'churn-analytics'
    if (path === '/churn-predictions') return 'churn-predictions'
    if (path === '/cohort-analysis') return 'cohort-analysis'
    if (path === '/settings') return 'settings'
    return 'dashboard'
  }

  const currentSection = getCurrentSection()

  return (
    <div className="fixed left-0 top-0 h-full w-[240px] bg-white border-r border-gray-200 z-40 flex flex-col">
      {/* Logo/Brand Section */}
      <div className="p-8 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {/* Pulsing Logo */}
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm opacity-90"></div>
            </div>
            <div className="absolute inset-0 w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg animate-pulse opacity-30"></div>
          </div>
          <div>
            <h1 className="text-2xl font-light text-black tracking-tight">EchoIQ</h1>
            <p className="text-sm font-light text-gray-600 mt-1">Intelligent Analytics</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-8">
        <ul className="space-y-2 px-6">
          {sidebarItems.map((item) => {
            const isActive = currentSection === item.id
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleItemClick(item)}
                  className={`
                    w-full text-left px-4 py-3 font-light transition-all duration-200
                    ${isActive 
                      ? 'text-black bg-gray-50 border-l-2 border-black' 
                      : 'text-gray-600 hover:text-black hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="text-base">
                    {item.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200">
        <div className="text-xs font-light text-gray-400">
          <p>© 2024 EchoIQ</p>
          <p className="mt-1">Clean Analytics</p>
        </div>
      </div>
    </div>
  )
}

export default Sidebar