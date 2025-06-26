import React from 'react'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Users, ShoppingCart, Brain, Zap } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  const features = [
    {
      icon: <BarChart3 className="h-8 w-8 text-blue-600" />,
      title: "Sales Analytics",
      description: "Real-time revenue tracking and sales performance insights"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-green-600" />,
      title: "Predictive Analytics",
      description: "AI-powered forecasting and trend analysis"
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: "Customer Intelligence",
      description: "Deep customer behavior analysis and segmentation"
    },
    {
      icon: <ShoppingCart className="h-8 w-8 text-orange-600" />,
      title: "Product Performance",
      description: "Comprehensive product analytics and optimization"
    },
    {
      icon: <Brain className="h-8 w-8 text-pink-600" />,
      title: "AI Insights",
      description: "Intelligent recommendations and automated insights"
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-600" />,
      title: "Real-time Data",
      description: "Live dashboard updates with instant data refresh"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">ShopifyIQ</h1>
          </div>
          <Button 
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Access Dashboard
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-slate-900 mb-6">
            AI-Powered Analytics for
            <span className="text-blue-600"> Shopify Stores</span>
          </h2>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            Transform your Shopify data into actionable insights with advanced analytics, 
            predictive modeling, and intelligent recommendations that drive growth.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
            >
              View Live Dashboard
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="px-8 py-3 text-lg border-slate-300 hover:bg-slate-50"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-slate-900 mb-4">
            Comprehensive Analytics Suite
          </h3>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Everything you need to understand your business performance and make data-driven decisions
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  {feature.icon}
                  <CardTitle className="text-slate-900">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Transform Your Analytics?
          </h3>
          <p className="text-xl mb-8 text-blue-100">
            Get instant access to your comprehensive analytics dashboard
          </p>
          <Button 
            size="lg"
            onClick={() => router.push('/dashboard')}
            className="bg-white text-blue-600 hover:bg-slate-100 px-8 py-3 text-lg"
          >
            Access Dashboard Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BarChart3 className="h-6 w-6 text-blue-400" />
            <span className="text-lg font-semibold">ShopifyIQ</span>
          </div>
          <p className="text-sm">
            © 2024 ShopifyIQ. Advanced analytics for modern e-commerce.
          </p>
        </div>
      </footer>
    </div>
  )
}