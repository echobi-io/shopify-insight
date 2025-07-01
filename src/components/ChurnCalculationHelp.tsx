import React, { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ChurnCalculationHelpProps {
  type: 'churn-rate' | 'risk-score' | 'revenue-at-risk' | 'prediction-model' | 'radar-chart' | 'feature-importance'
}

const ChurnCalculationHelp: React.FC<ChurnCalculationHelpProps> = ({ type }) => {
  const [isOpen, setIsOpen] = useState(false)

  const getHelpContent = () => {
    switch (type) {
      case 'churn-rate':
        return {
          title: 'Churn Rate Calculation',
          description: 'How we calculate customer churn rate',
          content: (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Formula:</h4>
                <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
                  Churn Rate = (Customers Lost / Total Customers at Start) × 100
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Calculation Method:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>We identify customers who haven't made a purchase within the configured churn period (default: 90 days)</li>
                  <li>Count total customers at the beginning of the period</li>
                  <li>Calculate the percentage of customers who churned</li>
                  <li>The churn period can be configured in Settings</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Example:</h4>
                <div className="bg-blue-50 p-3 rounded-md text-sm">
                  <p>If you started with 1,000 customers and 50 haven't purchased in 90 days:</p>
                  <p className="font-mono mt-1">Churn Rate = (50 / 1,000) × 100 = 5%</p>
                </div>
              </div>
            </div>
          )
        }

      case 'risk-score':
        return {
          title: 'Risk Score Calculation',
          description: 'How we calculate customer churn risk scores',
          content: (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Risk Score Components:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Recency (40% weight):</strong> Days since last order</li>
                  <li><strong>Frequency (30% weight):</strong> Total number of orders</li>
                  <li><strong>Monetary (20% weight):</strong> Total amount spent</li>
                  <li><strong>Engagement (10% weight):</strong> Order frequency pattern</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Risk Levels:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span><strong>High Risk (70-100):</strong> Likely to churn soon</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span><strong>Medium Risk (40-69):</strong> At risk of churning</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span><strong>Low Risk (0-39):</strong> Unlikely to churn</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Calculation Process:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Normalize each factor to a 0-100 scale</li>
                  <li>Apply weights to each normalized factor</li>
                  <li>Sum weighted scores to get final risk score</li>
                  <li>Classify into risk levels based on thresholds</li>
                </ol>
              </div>
            </div>
          )
        }

      case 'revenue-at-risk':
        return {
          title: 'Revenue at Risk Calculation',
          description: 'How we calculate potential revenue loss from churn',
          content: (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Formula:</h4>
                <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
                  Revenue at Risk = Customer LTV × Churn Probability
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Components:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Customer LTV:</strong> Lifetime Value based on historical spending</li>
                  <li><strong>Churn Probability:</strong> Derived from risk score (0-100% scale)</li>
                  <li><strong>Time Horizon:</strong> Expected revenue loss over next 12 months</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Risk Categories:</h4>
                <div className="space-y-2 text-sm">
                  <div>• <strong>High Risk:</strong> 70-90% probability of churn</div>
                  <div>• <strong>Medium Risk:</strong> 40-69% probability of churn</div>
                  <div>• <strong>Low Risk:</strong> 0-39% probability of churn</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Example:</h4>
                <div className="bg-blue-50 p-3 rounded-md text-sm">
                  <p>Customer with $2,000 LTV and 80% churn probability:</p>
                  <p className="font-mono mt-1">Revenue at Risk = $2,000 × 0.80 = $1,600</p>
                </div>
              </div>
            </div>
          )
        }

      case 'prediction-model':
        return {
          title: 'Prediction Model Confidence',
          description: 'How we calculate prediction confidence scores',
          content: (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Model Factors:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Data Quality:</strong> Completeness of customer data</li>
                  <li><strong>Historical Patterns:</strong> Consistency of past behavior</li>
                  <li><strong>Sample Size:</strong> Number of similar customers</li>
                  <li><strong>Feature Stability:</strong> Reliability of input variables</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Confidence Levels:</h4>
                <div className="space-y-2 text-sm">
                  <div>• <strong>High (80-100%):</strong> Very reliable prediction</div>
                  <div>• <strong>Medium (60-79%):</strong> Moderately reliable prediction</div>
                  <div>• <strong>Low (0-59%):</strong> Less reliable prediction</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Factors Affecting Confidence:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Amount of historical data available</li>
                  <li>Consistency of customer behavior patterns</li>
                  <li>Similarity to other customers in dataset</li>
                  <li>Recency of customer activity</li>
                </ul>
              </div>
            </div>
          )
        }

      case 'radar-chart':
        return {
          title: 'Radar Chart Metrics',
          description: 'Understanding prediction model performance metrics',
          content: (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Performance Metrics:</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong>Accuracy:</strong> Overall correctness of predictions
                    <div className="text-gray-600 ml-4">Formula: (True Positives + True Negatives) / Total Predictions</div>
                  </div>
                  <div>
                    <strong>Precision:</strong> Accuracy of positive predictions
                    <div className="text-gray-600 ml-4">Formula: True Positives / (True Positives + False Positives)</div>
                  </div>
                  <div>
                    <strong>Recall:</strong> Ability to find all positive cases
                    <div className="text-gray-600 ml-4">Formula: True Positives / (True Positives + False Negatives)</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Model Types:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Behavioral Analysis:</strong> Based on purchase patterns</li>
                  <li><strong>RFM Segmentation:</strong> Recency, Frequency, Monetary analysis</li>
                  <li><strong>Order Pattern:</strong> Time-based ordering behavior</li>
                  <li><strong>Time-based Risk:</strong> Days since last activity</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Reading the Chart:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Larger areas indicate better overall performance</li>
                  <li>Each axis represents a different metric (0-100%)</li>
                  <li>Compare models by overlaying their performance areas</li>
                </ul>
              </div>
            </div>
          )
        }

      case 'feature-importance':
        return {
          title: 'Feature Importance Analysis',
          description: 'How we determine which factors most influence churn risk',
          content: (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Key Risk Factors:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Days Since Last Order:</strong> Time elapsed since last purchase</li>
                  <li><strong>Order Frequency Decline:</strong> Decreasing purchase frequency</li>
                  <li><strong>Average Order Value:</strong> Changes in spending patterns</li>
                  <li><strong>Seasonal Patterns:</strong> Deviation from expected seasonal behavior</li>
                  <li><strong>Product Category Shifts:</strong> Changes in product preferences</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Importance Calculation:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Analyze correlation between each factor and churn outcomes</li>
                  <li>Calculate average impact across all customers</li>
                  <li>Weight by frequency of occurrence</li>
                  <li>Rank factors by their predictive power</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Impact Scores:</h4>
                <div className="space-y-2 text-sm">
                  <div>• <strong>High Impact (70-100):</strong> Strong predictor of churn</div>
                  <div>• <strong>Medium Impact (40-69):</strong> Moderate predictor of churn</div>
                  <div>• <strong>Low Impact (0-39):</strong> Weak predictor of churn</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Using This Information:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Focus retention efforts on high-impact factors</li>
                  <li>Monitor customers showing multiple risk factors</li>
                  <li>Customize interventions based on specific risk patterns</li>
                </ul>
              </div>
            </div>
          )
        }

      default:
        return {
          title: 'Calculation Help',
          description: 'Information about this calculation',
          content: <div>No help content available for this calculation type.</div>
        }
    }
  }

  const helpContent = getHelpContent()

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-4 w-4 p-0 ml-1 text-gray-400 hover:text-gray-600"
        onClick={() => setIsOpen(true)}
      >
        <HelpCircle className="h-3 w-3" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{helpContent.title}</DialogTitle>
            <DialogDescription>{helpContent.description}</DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {helpContent.content}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ChurnCalculationHelp