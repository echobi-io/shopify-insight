import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const [shopDomain, setShopDomain] = useState('');
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    const { shop, session_id } = router.query;
    if (shop && typeof shop === 'string') {
      setShopDomain(shop);
    }
    if (session_id && typeof session_id === 'string') {
      setSessionId(session_id);
    }
  }, [router.query]);

  const handleContinueToApp = () => {
    if (shopDomain) {
      // Redirect to the Shopify app installation completion
      window.location.href = `/auth/shopify/callback?shop=${shopDomain}&subscribed=true`;
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
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
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to echoSignal Pro!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your subscription is now active. Let's get your analytics set up.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Success Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-teal-600" />
                <span>Subscription Active</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-900">Payment Successful</p>
                    <p className="text-sm text-green-700">Your monthly subscription is now active</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-semibold">echoSignal Pro</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold">$19.99/month</span>
                </div>
                {shopDomain && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Store:</span>
                    <span className="font-semibold">{shopDomain}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Next billing:</span>
                  <span className="font-semibold">
                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600">
                  A confirmation email has been sent to your email address with your receipt and subscription details.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Complete Installation</h4>
                    <p className="text-sm text-gray-600">Finish setting up the app in your Shopify store</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Data Sync</h4>
                    <p className="text-sm text-gray-600">We'll automatically sync your store data</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Start Analyzing</h4>
                    <p className="text-sm text-gray-600">Access your dashboard and insights</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleContinueToApp}
                className="w-full mt-6 bg-teal-600 hover:bg-teal-700"
                size="lg"
              >
                <span>Continue to App</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Reminder */}
        <Card>
          <CardHeader>
            <CardTitle>Your Pro Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                'Unlimited data analysis',
                'AI-powered insights & recommendations',
                'Advanced customer segmentation',
                'Predictive analytics & forecasting',
                'Real-time dashboard updates',
                'Export capabilities',
                'Priority email support',
                'Advanced reporting tools'
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Need help getting started? We're here to help!
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm">
            <a href="mailto:support@echosignal.com" className="text-teal-600 hover:text-teal-700">
              Email Support
            </a>
            <span className="text-gray-300">|</span>
            <a href="#" className="text-teal-600 hover:text-teal-700">
              Documentation
            </a>
            <span className="text-gray-300">|</span>
            <a href="#" className="text-teal-600 hover:text-teal-700">
              Video Tutorials
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}