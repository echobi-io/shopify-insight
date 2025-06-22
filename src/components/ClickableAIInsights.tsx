import React from 'react';
import { motion } from 'framer-motion';
import { Brain, MousePointer, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ClickableAIInsightsProps {
  insights: string[];
  onInsightClick: (drillType: string, filters?: any) => void;
}

const ClickableAIInsights: React.FC<ClickableAIInsightsProps> = ({
  insights,
  onInsightClick
}) => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  // Function to detect and make clickable insights
  const renderClickableInsight = (text: string, index: number) => {
    // Define patterns that should be clickable with their corresponding drill types
    const clickablePatterns = [
      { pattern: /revenue.*(\d+\.?\d*)%/i, drillType: 'revenue' },
      { pattern: /order.*volume.*(\d+\.?\d*)%/i, drillType: 'orders' },
      { pattern: /churn.*risk.*(\d+\.?\d*)%/i, drillType: 'churn' },
      { pattern: /february.*cohort/i, drillType: 'customers', filters: { segment: 'february-cohort' } },
      { pattern: /single-purchase.*customers/i, drillType: 'customers', filters: { segment: 'single-purchase' } },
      { pattern: /aov.*declined.*(\d+\.?\d*)%/i, drillType: 'aov' },
      { pattern: /ordering.*rate.*(\d+\.?\d*)%/i, drillType: 'customers', filters: { segment: 'ordering' } },
      { pattern: /weekend.*orders/i, drillType: 'orders', filters: { timeframe: 'weekend' } },
      { pattern: /price.*optimization/i, drillType: 'revenue', filters: { analysis: 'pricing' } }
    ];

    // Split text into parts and identify clickable segments
    let parts: Array<{ text: string; clickable?: boolean; drillType?: string; filters?: any }> = [{ text }];

    clickablePatterns.forEach(({ pattern, drillType, filters }) => {
      parts = parts.flatMap(part => {
        if (part.clickable) return [part]; // Already processed

        const match = part.text.match(pattern);
        if (match) {
          const beforeMatch = part.text.substring(0, match.index);
          const matchText = match[0];
          const afterMatch = part.text.substring((match.index || 0) + matchText.length);

          return [
            ...(beforeMatch ? [{ text: beforeMatch }] : []),
            { text: matchText, clickable: true, drillType, filters },
            ...(afterMatch ? [{ text: afterMatch }] : [])
          ].filter(p => p.text);
        }
        return [part];
      });
    });

    return (
      <span key={index}>
        {parts.map((part, partIndex) => 
          part.clickable ? (
            <span
              key={partIndex}
              className="text-primary underline cursor-pointer hover:text-primary/80 transition-colors inline-flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                onInsightClick(part.drillType!, part.filters);
              }}
            >
              {part.text}
              <ExternalLink className="w-3 h-3" />
            </span>
          ) : (
            <span key={partIndex}>{part.text}</span>
          )
        )}
      </span>
    );
  };

  return (
    <motion.div variants={fadeInUp}>
      <Card className="group hover:border-primary/30 transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            AI-Generated Insights
            <Badge variant="secondary" className="ml-2">Updated 2h ago</Badge>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
              <MousePointer className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Summary */}
          <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
            <p className="text-sm leading-relaxed">
              {renderClickableInsight(insights[0], 0)}
            </p>
          </div>
          
          {/* Key Takeaways */}
          {insights.length > 1 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Key Takeaways:</h4>
              <ul className="space-y-1">
                {insights.slice(1).map((takeaway, index) => (
                  <li key={index + 1} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    {renderClickableInsight(takeaway, index + 1)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Hint */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              💡 Click on highlighted metrics to drill down into detailed data
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ClickableAIInsights;