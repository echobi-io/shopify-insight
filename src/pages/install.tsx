import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShopifyAuth } from '@/lib/shopify/auth';
import { BarChart3, Shield, Zap, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function InstallPage() {
  const router = useRouter();
  const [shopDomain, setShopDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isValidDomain, setIsValidDomain] = useState(false);

  // Check if we have a shop parameter from URL
  useEffect(() => {
    const { shop } = router.query;
    if (shop && typeof shop === 'string') {
      const cleanDomain = ShopifyAuth.extractShopDomain(shop);
      setShopDomain(cleanDomain);
      setIsValidDomain(ShopifyAuth.validateShopDomain(cleanDomain));
    }
  }, [router.query]);

  const handleShopDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setShopDomain(value);
    setError('');
    
    if (value) {
      const cleanDomain = ShopifyAuth.extractShopDomain(value);
      setIsValidDomain(ShopifyAuth.validateShopDomain(cleanDomain));
    } else {
      setIsValidDomain(false);
    }
  };

  const handleInstall = async () => {
    if (!shopDomain) {
      setError('Please enter your shop domain');
      return;
    }

    const cleanDomain = ShopifyAuth.extractShopDomain(shopDomain);
    
    if (!ShopifyAuth.validateShopDomain(cleanDomain)) {
      setError('Please enter a valid Shopify store domain (e.g., mystore.myshopify.com)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Generate the OAuth URL and redirect
      const installUrl = ShopifyAuth.generateInstallUrl(cleanDomain);
      window.location.href = installUrl;
    } catch (err) {
      console.error('Installation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start installation');
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInstall();
    }
  };

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
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Install echoSignal
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get AI-powered analytics and insights for your Shopify store in minutes
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Installation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-teal-600" />
                <span>Quick Install</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="shop-domain">Your Shopify Store Domain</Label>
                <div className="relative">
                  <Input
                    id="shop-domain"
                    type="text"
                    placeholder="mystore.myshopify.com"
                    value={shopDomain}
                    onChange={handleShopDomainChange}
                    onKeyPress={handleKeyPress}
                    className={`pr-10 ${
                      shopDomain && (isValidDomain ? 'border-green-300' : 'border-red-300')
                    }`}
                    disabled={isLoading}
                  />
                  {shopDomain && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {isValidDomain ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Enter your Shopify store URL (e.g., mystore.myshopify.com)
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleInstall}
                disabled={!isValidDomain || isLoading}
                className="w-full bg-teal-600 hover:bg-teal-700"
                size="lg"
              >
                {isLoading ? 'Installing...' : 'Install echoSignal'}
              </Button>


            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-teal-600" />
                <span>What You'll Get</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    icon: BarChart3,
                    title: 'Real-time Analytics',
                    description: 'Track sales, orders, and customer behavior in real-time'
                  },
                  {
                    icon: TrendingUp,
                    title: 'Predictive Insights',
                    description: 'AI-powered predictions for churn, LTV, and growth opportunities'
                  },
                  {
                    icon: Shield,
                    title: 'Secure & Private',
                    description: 'Your data is encrypted and never shared with third parties'
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Installation Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Installation Process</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: '1',
                  title: 'Enter Store Domain',
                  description: 'Provide your Shopify store URL above'
                },
                {
                  step: '2',
                  title: 'Authorize App',
                  description: 'Grant echoSignal permission to access your store data'
                },
                {
                  step: '3',
                  title: 'Start Analyzing',
                  description: 'Begin getting insights immediately after installation'
                }
              ].map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
            <Shield className="h-4 w-4" />
            <span>
              echoSignal only requests read permissions and never modifies your store data
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}