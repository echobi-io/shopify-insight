import React from 'react'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3, TrendingUp, Users, ShoppingCart, Brain, Zap, ArrowRight, Star, Play, CheckCircle, Shield, Clock, Globe } from 'lucide-react'
import Image from 'next/image'

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="relative z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">EchoIQ</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost"
                onClick={() => router.push('/login')}
                className="text-slate-300 hover:text-white hover:bg-slate-800"
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
      <section className="relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-900 to-purple-900/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium mb-8 border border-blue-500/20">
                <Star className="w-4 h-4 mr-2" />
                Trusted by 1000+ Shopify stores
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Transform Your
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent block">
                  Shopify Analytics
                </span>
              </h1>
              
              <p className="text-xl text-slate-300 mb-10 leading-relaxed">
                Unlock the power of AI-driven insights to boost sales, understand customers, and predict trends with precision.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
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
                  className="px-8 py-4 text-lg border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white group"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center space-x-8 text-slate-400">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-sm">14-day free trial</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span className="text-sm">Enterprise security</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <span className="text-sm">Real-time data</span>
                </div>
              </div>
            </div>

            {/* Right Column - Dashboard Preview */}
            <div className="relative">
              <div className="relative bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
                {/* Browser Bar */}
                <div className="bg-slate-700 px-4 py-3 border-b border-slate-600 flex items-center space-x-2">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 bg-slate-600 rounded-md px-3 py-1 text-sm text-slate-300 ml-4">
                    app.echoiq.com/dashboard
                  </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900">
                  {/* Top Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400">Revenue</p>
                          <p className="text-2xl font-bold text-white">$124.5K</p>
                          <p className="text-sm text-green-400">+12.5%</p>
                        </div>
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-green-400" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400">Orders</p>
                          <p className="text-2xl font-bold text-white">2,847</p>
                          <p className="text-sm text-blue-400">+8.2%</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5 text-blue-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600/50">
                    <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
                    <div className="h-32 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg flex items-end justify-between p-4">
                      {[40, 65, 45, 80, 60, 90, 75, 95].map((height, i) => (
                        <div
                          key={i}
                          className="bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-sm"
                          style={{ height: `${height}%`, width: '8%' }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-500/20 rounded-full blur-xl"></div>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-purple-500/20 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Powerful Analytics Suite
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Everything you need to understand your business and drive growth
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: BarChart3, title: "Sales Analytics", desc: "Real-time revenue tracking and performance insights", color: "blue" },
              { icon: TrendingUp, title: "Predictive Analytics", desc: "AI-powered forecasting and trend analysis", color: "green" },
              { icon: Users, title: "Customer Intelligence", desc: "Deep behavior analysis and segmentation", color: "purple" },
              { icon: ShoppingCart, title: "Product Performance", desc: "Comprehensive product analytics", color: "orange" },
              { icon: Brain, title: "AI Insights", desc: "Intelligent recommendations and insights", color: "pink" },
              { icon: Zap, title: "Real-time Data", desc: "Live dashboard with instant updates", color: "yellow" }
            ].map((feature, index) => (
              <Card key={index} className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 bg-${feature.color}-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`h-6 w-6 text-${feature.color}-400`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-300">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2 text-white">1000+</div>
              <div className="text-blue-100">Active Stores</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 text-white">$50M+</div>
              <div className="text-blue-100">Revenue Analyzed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 text-white">25%</div>
              <div className="text-blue-100">Average Growth</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 text-white">99.9%</div>
              <div className="text-blue-100">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Trusted by Leading Brands
            </h2>
            <p className="text-slate-300">
              Join thousands of successful merchants who trust EchoIQ
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
            {/* Placeholder for brand logos */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-700 rounded-lg h-16 flex items-center justify-center">
                <Globe className="h-8 w-8 text-slate-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Analytics?
          </h3>
          <p className="text-xl text-slate-300 mb-10">
            Join thousands of successful merchants using EchoIQ to drive growth
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
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
              className="px-8 py-4 text-lg border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Schedule Demo
            </Button>
          </div>
          <p className="text-sm text-slate-400">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
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