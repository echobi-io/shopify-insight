import React from 'react'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3, TrendingUp, Users, ShoppingCart, Brain, Zap, ArrowRight, Star, Play } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="relative z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">EchoIQ</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost"
                onClick={() => router.push('/login')}
                className="text-slate-600 hover:text-slate-900"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-8">
              <Star className="w-4 h-4 mr-2" />
              Trusted by 1000+ Shopify stores
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              Analytics that
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                drive growth
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Transform your Shopify data into actionable insights with AI-powered analytics. 
              Predict trends, understand customers, and optimize performance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button 
                size="lg"
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg group"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="px-8 py-4 text-lg border-slate-300 hover:bg-slate-50 group"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative max-w-6xl mx-auto">
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              {/* Browser Bar */}
              <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center space-x-2">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="flex-1 bg-white rounded-md px-3 py-1 text-sm text-slate-500 ml-4">
                  app.echoiq.com/dashboard
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 bg-gradient-to-br from-slate-50 to-white">
                {/* Top Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Revenue</p>
                        <p className="text-2xl font-bold text-slate-900">$124.5K</p>
                        <p className="text-sm text-green-600">+12.5%</p>
                      </div>
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Orders</p>
                        <p className="text-2xl font-bold text-slate-900">2,847</p>
                        <p className="text-sm text-blue-600">+8.2%</p>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Customers</p>
                        <p className="text-2xl font-bold text-slate-900">1,429</p>
                        <p className="text-sm text-purple-600">+15.3%</p>
                      </div>
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Conversion</p>
                        <p className="text-2xl font-bold text-slate-900">3.2%</p>
                        <p className="text-sm text-orange-600">+0.8%</p>
                      </div>
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Brain className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Trend</h3>
                    <div className="h-48 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-end justify-between p-4">
                      {[40, 65, 45, 80, 60, 90, 75, 95, 70, 85, 100, 90].map((height, i) => (
                        <div
                          key={i}
                          className="bg-gradient-to-t from-blue-600 to-purple-600 rounded-t-sm"
                          style={{ height: `${height}%`, width: '6%' }}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Customer Insights</h3>
                    <div className="h-48 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg flex items-center justify-center">
                      <div className="relative w-32 h-32">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-20"></div>
                        <div className="absolute inset-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-full opacity-40"></div>
                        <div className="absolute inset-4 bg-gradient-to-r from-green-600 to-blue-700 rounded-full opacity-60"></div>
                        <div className="absolute inset-6 bg-gradient-to-r from-green-700 to-blue-800 rounded-full"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">AI</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-200 rounded-full opacity-20 blur-xl"></div>
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-purple-200 rounded-full opacity-20 blur-xl"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything you need to grow
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Comprehensive analytics suite designed for modern Shopify merchants
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: BarChart3, title: "Sales Analytics", desc: "Real-time revenue tracking and performance insights" },
              { icon: TrendingUp, title: "Predictive Analytics", desc: "AI-powered forecasting and trend analysis" },
              { icon: Users, title: "Customer Intelligence", desc: "Deep behavior analysis and segmentation" },
              { icon: ShoppingCart, title: "Product Performance", desc: "Comprehensive product analytics" },
              { icon: Brain, title: "AI Insights", desc: "Intelligent recommendations and insights" },
              { icon: Zap, title: "Real-time Data", desc: "Live dashboard with instant updates" }
            ].map((feature, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-blue-100">Active Stores</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">$50M+</div>
              <div className="text-blue-100">Revenue Analyzed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">25%</div>
              <div className="text-blue-100">Average Growth</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="text-4xl font-bold text-slate-900 mb-6">
            Ready to transform your analytics?
          </h3>
          <p className="text-xl text-slate-600 mb-10">
            Join thousands of successful merchants using EchoIQ to drive growth
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
            >
              Start Free Trial
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="px-8 py-4 text-lg border-slate-300 hover:bg-white"
            >
              Schedule Demo
            </Button>
          </div>
          <p className="text-sm text-slate-500 mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">EchoIQ</span>
            </div>
            <div className="flex items-center space-x-8 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm">
            <p>© 2024 EchoIQ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}