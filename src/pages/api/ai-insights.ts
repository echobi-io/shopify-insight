import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const businessData: BusinessData = req.body;

    // Create a comprehensive data summary for the AI
    const dataSummary = createDataSummary(businessData);

    const prompt = `
You are an expert e-commerce business analyst. Analyze the following Shopify store data and provide 3-6 actionable business insights in JSON format.

Business Data Summary:
${dataSummary}

Please provide insights as a JSON array with the following structure:
[
  {
    "id": "unique-id",
    "type": "positive|negative|neutral|warning",
    "title": "Short insight title",
    "description": "Detailed insight description with specific numbers and actionable advice",
    "value": "key metric value if applicable",
    "trend": "up|down|stable",
    "priority": "high|medium|low"
  }
]

Guidelines:
1. Focus on actionable insights, not just observations
2. Include specific numbers from the data when relevant
3. Prioritize insights that can drive revenue or reduce costs
4. Consider seasonal trends, growth patterns, and customer behavior
5. Provide concrete recommendations for improvement
6. Keep descriptions concise but informative (2-3 sentences max)
7. Ensure insights are relevant to e-commerce business owners

Return only the JSON array, no additional text.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a business intelligence expert specializing in e-commerce analytics. Provide actionable insights based on data analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    // Parse the AI response
    let insights: AIInsight[];
    try {
      insights = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      // Fallback to a basic insight if parsing fails
      insights = [{
        id: 'ai-analysis',
        type: 'neutral',
        title: 'AI Analysis in Progress',
        description: 'Our AI is analyzing your business data to provide personalized insights. Please try again in a moment.',
        priority: 'medium'
      }];
    }

    // Validate and sanitize insights
    const validatedInsights = insights.map((insight, index) => ({
      id: insight.id || `ai-insight-${index}`,
      type: ['positive', 'negative', 'neutral', 'warning'].includes(insight.type) ? insight.type : 'neutral',
      title: insight.title || 'Business Insight',
      description: insight.description || 'Analysis in progress...',
      value: insight.value,
      trend: ['up', 'down', 'stable'].includes(insight.trend || '') ? insight.trend : undefined,
      priority: ['high', 'medium', 'low'].includes(insight.priority || '') ? insight.priority : 'medium'
    }));

    res.status(200).json({ insights: validatedInsights });

  } catch (error) {
    console.error('AI Insights API Error:', error);
    
    // Return fallback insights on error
    const fallbackInsights: AIInsight[] = [{
      id: 'ai-unavailable',
      type: 'neutral',
      title: 'AI Analysis Temporarily Unavailable',
      description: 'We\'re experiencing temporary issues with our AI analysis. Your data is being processed and insights will be available shortly.',
      priority: 'low'
    }];

    res.status(200).json({ insights: fallbackInsights });
  }
}

function createDataSummary(data: BusinessData): string {
  const { kpiData, previousYearKpiData, productData, topCustomersData, orderTimingData, currency = 'USD', dateRange } = data;
  
  let summary = `Analysis Period: ${dateRange?.startDate || 'N/A'} to ${dateRange?.endDate || 'N/A'}\n`;
  summary += `Currency: ${currency}\n\n`;

  // KPI Summary
  if (kpiData) {
    summary += `CURRENT PERFORMANCE:\n`;
    summary += `- Total Revenue: ${formatCurrency(kpiData.totalRevenue, currency)}\n`;
    summary += `- Total Orders: ${kpiData.totalOrders || 'N/A'}\n`;
    summary += `- Average Order Value: ${formatCurrency(kpiData.averageOrderValue, currency)}\n`;
    summary += `- Total Customers: ${kpiData.totalCustomers || 'N/A'}\n`;
    summary += `- Conversion Rate: ${kpiData.conversionRate ? (kpiData.conversionRate * 100).toFixed(2) + '%' : 'N/A'}\n\n`;
  }

  // Year-over-year comparison
  if (kpiData && previousYearKpiData) {
    summary += `YEAR-OVER-YEAR CHANGES:\n`;
    if (kpiData.totalRevenue && previousYearKpiData.totalRevenue) {
      const revenueChange = ((kpiData.totalRevenue - previousYearKpiData.totalRevenue) / previousYearKpiData.totalRevenue) * 100;
      summary += `- Revenue Change: ${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}%\n`;
    }
    if (kpiData.totalOrders && previousYearKpiData.totalOrders) {
      const orderChange = ((kpiData.totalOrders - previousYearKpiData.totalOrders) / previousYearKpiData.totalOrders) * 100;
      summary += `- Order Volume Change: ${orderChange > 0 ? '+' : ''}${orderChange.toFixed(1)}%\n`;
    }
    if (kpiData.averageOrderValue && previousYearKpiData.averageOrderValue) {
      const aovChange = ((kpiData.averageOrderValue - previousYearKpiData.averageOrderValue) / previousYearKpiData.averageOrderValue) * 100;
      summary += `- AOV Change: ${aovChange > 0 ? '+' : ''}${aovChange.toFixed(1)}%\n`;
    }
    summary += '\n';
  }

  // Top Products
  if (productData && productData.length > 0) {
    summary += `TOP PRODUCTS:\n`;
    productData.slice(0, 5).forEach((product, index) => {
      summary += `${index + 1}. ${product.product || 'Unknown'}: ${formatCurrency(product.revenue, currency)} (${product.quantity || 0} units)\n`;
    });
    summary += '\n';
  }

  // Top Customers
  if (topCustomersData && topCustomersData.length > 0) {
    summary += `TOP CUSTOMERS:\n`;
    topCustomersData.slice(0, 3).forEach((customer, index) => {
      summary += `${index + 1}. Customer ${customer.customer_id}: ${formatCurrency(customer.total_spent, currency)} across ${customer.order_count} orders\n`;
    });
    summary += '\n';
  }

  // Order Timing
  if (orderTimingData && orderTimingData.length > 0) {
    const peakHour = orderTimingData.reduce((max, current) => 
      current.order_count > max.order_count ? current : max
    );
    summary += `PEAK ACTIVITY:\n`;
    summary += `- Peak Hour: ${peakHour.hour}:00 with ${peakHour.order_count} orders\n\n`;
  }

  return summary;
}

function formatCurrency(value: number | undefined, currency: string): string {
  if (value === undefined || value === null) return 'N/A';
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'GBP' ? 'GBP' : 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(value);
}