import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HelpCircle, TrendingUp, Users, DollarSign, Target, BarChart3, PieChart } from 'lucide-react'

interface GraphExplanationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const GraphExplanationModal: React.FC<GraphExplanationModalProps> = ({ open, onOpenChange }) => {
  const graphExplanations = [
    {
      title: "Customer Distribution by Segment",
      icon: <PieChart className="w-5 h-5" />,
      type: "Pie Chart",
      purpose: "Shows how your customers are categorized based on their behavior",
      whatItMeans: "Each slice represents a different type of customer (high-value, loyal, new, etc.)",
      actionable: "Focus marketing efforts on the largest segments or nurture smaller high-value segments",
      color: "bg-blue-50 border-blue-200"
    },
    {
      title: "Revenue at Risk Trend",
      icon: <TrendingUp className="w-5 h-5" />,
      type: "Line Chart",
      purpose: "Tracks how much money you might lose from customers likely to stop buying",
      whatItMeans: "Higher lines = more revenue at risk. Spikes indicate periods when many valuable customers might churn",
      actionable: "When you see spikes, investigate what happened and create retention campaigns",
      color: "bg-red-50 border-red-200"
    },
    {
      title: "Retention Curves by Cohort",
      icon: <Users className="w-5 h-5" />,
      type: "Line Chart",
      purpose: "Shows what percentage of customers from each signup month are still active",
      whatItMeans: "Higher lines = better retention. Steep drops indicate customers leaving quickly",
      actionable: "Compare different months to see what worked well for retention",
      color: "bg-green-50 border-green-200"
    },
    {
      title: "Cumulative Revenue per Customer",
      icon: <DollarSign className="w-5 h-5" />,
      type: "Line Chart", 
      purpose: "Shows average total revenue generated per customer over their lifetime",
      whatItMeans: "Steeper upward slopes = customers spending more over time",
      actionable: "Use this to predict future revenue and set customer acquisition budgets",
      color: "bg-purple-50 border-purple-200"
    },
    {
      title: "LTV Distribution",
      icon: <BarChart3 className="w-5 h-5" />,
      type: "Bar Chart",
      purpose: "Shows how many customers fall into different lifetime value ranges",
      whatItMeans: "Taller bars = more customers in that spending range",
      actionable: "Focus on moving customers from lower to higher value brackets",
      color: "bg-orange-50 border-orange-200"
    },
    {
      title: "Predicted LTV vs Current Spend",
      icon: <Target className="w-5 h-5" />,
      type: "Scatter Plot",
      purpose: "Compares what customers have already spent vs. what AI predicts they'll spend total",
      whatItMeans: "Points above the diagonal line = customers with high future potential",
      actionable: "Target customers with high predicted LTV but low current spend for upselling",
      color: "bg-yellow-50 border-yellow-200"
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Understanding Your Customer Analytics Graphs
          </DialogTitle>
          <DialogDescription>
            Learn how to interpret and use the various analytics graphs in your customer insights dashboard.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            Your customer insights dashboard contains several advanced analytics graphs. Here's what each one means and how to use them:
          </p>
          
          <div className="grid gap-4">
            {graphExplanations.map((graph, index) => (
              <Card key={index} className={graph.color}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {graph.icon}
                    {graph.title}
                    <Badge variant="outline" className="ml-auto">
                      {graph.type}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-1">Purpose:</h4>
                    <p className="text-sm text-gray-600">{graph.purpose}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-1">What it means:</h4>
                    <p className="text-sm text-gray-600">{graph.whatItMeans}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-1">How to use it:</h4>
                    <p className="text-sm text-gray-600">{graph.actionable}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Pro Tips:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use the date filters to compare different time periods</li>
              <li>• Export data as CSV for deeper analysis in Excel</li>
              <li>• Focus on trends rather than absolute numbers</li>
              <li>• Combine insights from multiple graphs for better decisions</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default GraphExplanationModal