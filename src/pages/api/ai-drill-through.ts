import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface DrillThroughRequest {
  kpiType: string;
  currentValue: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  timeSeriesData?: Array<{
    date: string;
    value: number;
  }>;
  topItems?: Array<{
    name: string;
    value: number;
    percentage?: number;
  }>;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  currency?: string;
}

interface AIInsight {
  type: 'positive' | 'negative' | 'neutral';
  message: string;
  impact?: 'high' | 'medium' | 'low';
}

interface AIRecommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  impact: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data: DrillThroughRequest = req.body;

    const prompt = `
You are an expert e-commerce business analyst. Analyze the following KPI drill-through data and provide insights and recommendations in JSON format.

KPI Type: ${data.kpiType}
Current Value: ${data.currentValue}
${data.change ? `Change: ${data.change > 0 ? '+' : ''}${data.change}% (${data.changeType})` : ''}
Date Range: ${data.dateRange?.startDate || 'N/A'} to ${data.dateRange?.endDate || 'N/A'}
Currency: ${data.currency || 'USD'}

${data.timeSeriesData ? `Time Series Data (last ${data.timeSeriesData.length} periods):
${data.timeSeriesData.slice(-10).map(d => `${d.date}: ${d.value}`).join('\n')}` : ''}

${data.topItems ? `Top Contributing Items:
${data.topItems.slice(0, 5).map((item, i) => `${i + 1}. ${item.name}: ${item.value}${item.percentage ? ` (${item.percentage.toFixed(1)}%)` : ''}`).join('\n')}` : ''}

Please provide a JSON response with the following structure:
{
  "insights": [
    {
      "type": "positive|negative|neutral",
      "message": "Specific insight about the data",
      "impact": "high|medium|low"
    }
  ],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "action": "Specific actionable recommendation",
      "impact": "Expected impact of this action"
    }
  ]
}

Guidelines:
1. Provide 2-4 insights based on the data patterns
2. Focus on actionable insights that explain trends and patterns
3. Provide 2-3 specific recommendations for improvement
4. Consider the KPI type when providing context-specific advice
5. Be specific about numbers and trends when available
6. Keep insights concise but informative

Return only the JSON response, no additional text.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a business intelligence expert specializing in e-commerce KPI analysis. Provide actionable insights and recommendations based on drill-through data."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      // Fallback response
      parsedResponse = {
        insights: [{
          type: 'neutral',
          message: 'AI analysis is processing your data to provide detailed insights.',
          impact: 'medium'
        }],
        recommendations: [{
          priority: 'medium',
          action: 'Monitor this metric closely and compare with historical trends',
          impact: 'Helps identify patterns and opportunities for optimization'
        }]
      };
    }

    // Validate and sanitize response
    const validatedResponse = {
      insights: (parsedResponse.insights || []).map((insight: any) => ({
        type: ['positive', 'negative', 'neutral'].includes(insight.type) ? insight.type : 'neutral',
        message: insight.message || 'Analysis in progress...',
        impact: ['high', 'medium', 'low'].includes(insight.impact) ? insight.impact : 'medium'
      })),
      recommendations: (parsedResponse.recommendations || []).map((rec: any) => ({
        priority: ['high', 'medium', 'low'].includes(rec.priority) ? rec.priority : 'medium',
        action: rec.action || 'Continue monitoring this metric',
        impact: rec.impact || 'May help improve performance'
      }))
    };

    res.status(200).json(validatedResponse);

  } catch (error) {
    console.error('AI Drill-through API Error:', error);
    
    // Return fallback response on error
    const fallbackResponse = {
      insights: [{
        type: 'neutral',
        message: 'AI analysis is temporarily unavailable. Manual analysis of trends and patterns is recommended.',
        impact: 'low'
      }],
      recommendations: [{
        priority: 'medium',
        action: 'Review historical data and identify trends manually',
        impact: 'Provides baseline understanding of performance patterns'
      }]
    };

    res.status(200).json(fallbackResponse);
  }
}