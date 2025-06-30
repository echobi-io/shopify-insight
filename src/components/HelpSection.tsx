import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Info
} from 'lucide-react'

interface HelpItem {
  question: string
  answer: string
  icon?: React.ReactNode
}

interface HelpSectionProps {
  title?: string
  items: HelpItem[]
  defaultOpen?: boolean
  className?: string
}

export const HelpSection: React.FC<HelpSectionProps> = ({
  title = "Help & Information",
  items,
  defaultOpen = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }

  return (
    <Card className={`card-minimal ${className}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardTitle className="text-lg font-medium text-black flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <span>{title}</span>
              </div>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      {item.icon && (
                        <div className="text-blue-600">
                          {item.icon}
                        </div>
                      )}
                      <span className="font-medium text-black text-sm">
                        {item.question}
                      </span>
                    </div>
                    {openItems.has(index) ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  
                  {openItems.has(index) && (
                    <div className="px-4 pb-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600 font-light leading-relaxed mt-2">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

// Predefined help content for different pages
export const getDashboardHelpItems = (): HelpItem[] => [
  {
    question: "Why do some charts show limited data periods?",
    answer: "Charts may display a subset of your selected date range (e.g., last 6 months) for optimal performance and readability. However, all KPI calculations and analytics use your full selected date range. This ensures fast loading while maintaining accurate metrics.",
    icon: <BarChart3 className="w-4 h-4" />
  },
  {
    question: "What's the difference between Calendar Year and Financial Year?",
    answer: "Calendar years run from January 1st to December 31st. Financial years are based on your business's fiscal period, which you can configure in Settings. Your financial year might start in April, July, or any other month depending on your business needs.",
    icon: <Calendar className="w-4 h-4" />
  },
  {
    question: "How are year-over-year comparisons calculated?",
    answer: "Year-over-year comparisons use the same time period from the previous year. For example, if you select 'Last 3 Months', we compare it to the same 3-month period from the previous year. Financial year comparisons respect your configured financial year settings.",
    icon: <TrendingUp className="w-4 h-4" />
  },
  {
    question: "What does 'Revenue at Risk' mean?",
    answer: "Revenue at Risk represents the potential lost revenue from customers identified as likely to churn (stop purchasing). It's calculated based on the historical spending patterns of customers in high and medium risk categories.",
    icon: <DollarSign className="w-4 h-4" />
  }
]

export const getSalesAnalysisHelpItems = (): HelpItem[] => [
  {
    question: "How does granularity affect chart data?",
    answer: "Granularity (daily, weekly, monthly) determines how data points are grouped in time-series charts. Daily shows individual days, weekly groups by weeks, monthly by months, etc. The underlying data respects your selected date range regardless of granularity.",
    icon: <BarChart3 className="w-4 h-4" />
  },
  {
    question: "Why might revenue trends show gaps?",
    answer: "Gaps in revenue trends typically indicate periods with no sales activity. This is normal for businesses with seasonal patterns or irregular sales cycles. The charts accurately reflect your actual sales data without artificial smoothing.",
    icon: <TrendingUp className="w-4 h-4" />
  },
  {
    question: "How are top products and customers ranked?",
    answer: "Rankings are based on total revenue within your selected date range. Products and customers are sorted by their contribution to total revenue, helping you identify your most valuable segments for the chosen period.",
    icon: <Users className="w-4 h-4" />
  }
]

export const getCustomerInsightsHelpItems = (): HelpItem[] => [
  {
    question: "How is churn risk calculated?",
    answer: "Churn risk is calculated using machine learning models that analyze customer behavior patterns including purchase frequency, recency, monetary value, and engagement trends. The churn period (configurable in Settings) defines when a customer is considered churned.",
    icon: <Users className="w-4 h-4" />
  },
  {
    question: "What affects Customer Lifetime Value (LTV) predictions?",
    answer: "LTV predictions consider historical purchase patterns, average order values, purchase frequency, customer tenure, and seasonal trends. The model continuously learns from your data to improve accuracy over time.",
    icon: <DollarSign className="w-4 h-4" />
  },
  {
    question: "How often are customer insights updated?",
    answer: "Customer insights are recalculated each time you refresh the page or change date filters. The underlying machine learning models are updated periodically as new transaction data becomes available, ensuring predictions remain current.",
    icon: <Info className="w-4 h-4" />
  }
]

export default HelpSection