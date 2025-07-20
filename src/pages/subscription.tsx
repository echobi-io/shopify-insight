import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getStripe } from '@/lib/stripe';
import { 
  BarChart3, 
  Check, 
  CreditCard, 
  Shield, 
  Zap, 
  TrendingUp, 
  Users, 
  Brain,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

export default function SubscriptionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shopDomain, setShopDomain] = useState('');

  useEffect(() => {
    const { shop } = router.query;
    if (shop && typeof shop === 'string') {
      setShopDomain(shop);
    }
  }, [router.query]);

  const handleSubscribe = async () => {
    if (!shopDomain) {
      setError('Shop domain is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shopDomain }),
      });

      const { sessionId } = await response.json();

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      const stripe = await getStripe();
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          throw error;
        }
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start subscription');
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Comprehensive sales, customer, and product analytics'
    },
    {
      icon: Brain,
      title: 'AI-Powered Insights',
      description: 'Get intelligent recommendations and predictions'
    },
    {
      icon: TrendingUp,
      title: 'Predictive Analytics',
      description: 'Forecast churn, LTV, and growth opportunities'
    },
    {
      icon: Users,
      title: 'Customer Segmentation',
      description: 'Advanced customer clustering and behavior analysis'
    },
    {
      icon: Zap,
      title: 'Real-time Data',
      description: 'Always up-to-date information from your store'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Enterprise-grade security for your data'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">echoSignal</span>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock the full power of AI-driven analytics for your Shopify store
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Pricing Card */}
          <Card className="border-2 border-teal-200 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-teal-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                Most Popular
              </div>
            </div>
            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                echoSignal Pro
              </CardTitle>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-5xl font-bold text-gray-900">$19.99</span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="text-gray-600 mt-4">
                Everything you need to grow your Shopify business
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleSubscribe}
                disabled={isLoading || !shopDomain}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 text-lg"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Subscribe Now</span>
                  </div>
                )}
              </Button>

              <div className="text-center text-sm text-gray-500">
                <div className="flex items-center justify-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Secure payment powered by Stripe</span>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">What's included:</h4>
                <div className="space-y-3">
                  {[
                    'Unlimited data analysis',
                    'AI-powered insights & recommendations',
                    'Advanced customer segmentation',
                    'Predictive analytics & forecasting',
                    'Real-time dashboard updates',
                    'Export capabilities',
                    'Email support'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-teal-600" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Overview */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Powerful Features
            </h3>
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h4>
                <p className="text-gray-600">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Is my data secure?</h4>
                <p className="text-gray-600">Absolutely. We use enterprise-grade encryption and never share your data with third parties. Your store data is processed securely and stored with industry-standard security measures.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h4>
                <p className="text-gray-600">We accept all major credit cards (Visa, MasterCard, American Express) through our secure Stripe payment processor.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Do you offer support?</h4>
                <p className="text-gray-600">Yes, all subscribers get email support. We typically respond within 24 hours during business days.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Stripe Secure</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4" />
              <span>Cancel Anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}