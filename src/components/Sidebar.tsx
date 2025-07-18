import React from 'react'
import { useRouter } from 'next/router'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Package, 
  UserX, 
  Target, 
  Settings,
  Home,
  FileText,
  BookmarkCheck
} from 'lucide-react'

// Import GitBranch2 separately to handle potential naming issues
import { GitBranch } from 'lucide-react'

interface SidebarProps {
  activeSection?: string
  onSectionChange?: (section: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection = 'dashboard', onSectionChange }) => {
  const router = useRouter()

  const sidebarSections = [
    {
      title: 'Overview',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          href: '/dashboard',
          icon: <Home className="w-4 h-4" />
        }
      ]
    },
    {
      title: 'Analytics',
      items: [
        {
          id: 'sales-analysis',
          label: 'Sales Analysis',
          href: '/sales-analysis',
          icon: <TrendingUp className="w-4 h-4" />
        },
        {
          id: 'customer-insights',
          label: 'Customer Insights',
          href: '/customer-insights',
          icon: <Users className="w-4 h-4" />
        },
        {
          id: 'product-insights',
          label: 'Product Insights',
          href: '/product-insights',
          icon: <Package className="w-4 h-4" />
        }
      ]
    },
    {
      title: 'Advanced Analytics',
      items: [
        {
          id: 'churn-analytics',
          label: 'Churn Analytics',
          href: '/churn-analytics',
          icon: <UserX className="w-4 h-4" />
        },
        {
          id: 'churn-predictions',
          label: 'Churn Predictions',
          href: '/churn-predictions',
          icon: <Target className="w-4 h-4" />
        },
        {
          id: 'cohort-analysis',
          label: 'Cohort Analysis',
          href: '/cohort-analysis',
          icon: <GitBranch className="w-4 h-4" />
        }
      ]
    },
    {
      title: 'Reports',
      items: [
        {
          id: 'reports',
          label: 'Reports',
          href: '/reports',
          icon: <FileText className="w-4 h-4" />
        },
        {
          id: 'saved-reports',
          label: 'Saved Reports',
          href: '/saved-reports',
          icon: <BookmarkCheck className="w-4 h-4" />
        }
      ]
    },
    {
      title: 'Configuration',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          href: '/settings',
          icon: <Settings className="w-4 h-4" />
        }
      ]
    }
  ]

  const handleItemClick = (item: any) => {
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
    if (path === '/reports') return 'reports'
    if (path === '/saved-reports') return 'saved-reports'
    if (path.startsWith('/reports/')) return 'reports'
    if (path === '/settings') return 'settings'
    return 'dashboard'
  }

  const currentSection = getCurrentSection()

  return (
    <div className="fixed left-0 top-0 h-full w-[280px] bg-white border-r border-gray-200 z-40 flex flex-col">
      {/* Logo/Brand Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {/* Modern Logo */}
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">echoSignal</h1>
            <p className="text-xs text-gray-500 mt-0.5">AI-Powered Analytics</p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 py-6 overflow-y-auto">
        <div className="px-4 space-y-8">
          {sidebarSections.map((section) => (
            <div key={section.title}>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = currentSection === item.id
                  
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleItemClick(item)}
                        className={`
                          w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                          ${isActive 
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          }
                        `}
                      >
                        <span className={`mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                          {item.icon}
                        </span>
                        <span className="truncate">
                          {item.label}
                        </span>
                        {isActive && (
                          <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-center">
          <div className="text-xs text-gray-500">
            <p className="font-medium">echoSignal Analytics</p>
            <p className="mt-1">© 2024 • v2.1.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar