interface BusinessData {
  kpiData?: any;
  previousYearKpiData?: any;
  productData?: any[];
  topCustomersData?: any[];
  orderTimingData?: any[];
  currency?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

interface AIInsight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  description: string;
  value?: string;
  trend?: 'up' | 'down' | 'stable';
  priority?: 'high' | 'medium' | 'low';
}

export async function generateAIInsights(businessData: BusinessData): Promise<AIInsight[]> {
  try {
    const response = await fetch('/api/ai-insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(businessData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.insights || [];
  } catch (error) {
    console.error('Failed to generate AI insights:', error);
    
    // Return fallback insight on error
    return [{
      id: 'ai-error',
      type: 'neutral',
      title: 'AI Analysis Unavailable',
      description: 'Unable to generate AI insights at this time. Please check your connection and try again.',
      priority: 'low'
    }];
  }
}

export function convertInsightToLegacyFormat(insight: AIInsight) {
  return {
    id: insight.id,
    type: insight.type,
    icon: getInsightIcon(insight.type),
    title: insight.title,
    description: insight.description,
    value: insight.value,
    trend: insight.trend,
  };
}

function getInsightIcon(type: string) {
  // This will be replaced with actual icons in the component
  switch (type) {
    case 'positive':
      return 'TrendingUp';
    case 'negative':
      return 'TrendingDown';
    case 'warning':
      return 'AlertTriangle';
    default:
      return 'Target';
  }
}