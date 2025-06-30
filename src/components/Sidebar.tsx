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
    if (path === '/settings') return 'settings'
    return 'dashboard'
  }

  const currentSection = getCurrentSection()

  return (
    <div className="fixed left-0 top-0 h-full w-[240px] bg-white border-r border-gray-200 z-40 flex flex-col">
      {/* Logo/Brand Section */}
      <div className="p-8 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-light text-black tracking-tight">EchoBI</h1>
          <p className="text-sm font-light text-gray-600 mt-1">Business Intelligence</p>
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
          <p>© 2024 EchoBI</p>
          <p className="mt-1">Clean Analytics</p>
        </div>
      </div>
    </div>
  )
}

export default Sidebar