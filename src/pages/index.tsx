import React from 'react'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Users, ShoppingCart, Brain, Zap, ArrowRight, Star, CheckCircle } from 'lucide-react'
import Image from 'next/image'

export default function LandingPage() {
  const router = useRouter()

  const features = [
    {
      icon: <BarChart3 className="h-6 w-6 text-primary" />,
      title: "Sales Analytics",
      description: "Real-time revenue tracking and sales performance insights"
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      title: "Predictive Analytics",
      description: "AI-powered forecasting and trend analysis"
    },
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: "Customer Intelligence",
      description: "Deep customer behavior analysis and segmentation"
    },
    {
      icon: <ShoppingCart className="h-6 w-6 text-primary" />,
      title: "Product Performance",
      description: "Comprehensive product analytics and optimization"
    },
    {
      icon: <Brain className="h-6 w-6 text-primary" />,
      title: "AI Insights",
      description: "Intelligent recommendations and automated insights"
    },
    {
      icon: <Zap className="h-6 w-6 text-primary" />,
      title: "Real-time Data",
      description: "Live dashboard updates with instant data refresh"
    }
  ]

  const benefits = [
    "Increase revenue by 25% on average",
    "Reduce customer churn by 40%",
    "Optimize inventory with 95% accuracy",
    "Save 10+ hours per week on reporting"
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">EchoIQ</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost"
              onClick={() => router.push('/login')}
              className="text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => router.push('/dashboard')}
              className="bg-primary hover:bg-primary/90"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Star className="w-4 h-4 mr-2" />
                AI-Powered Analytics
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Transform Your
                <span className="text-primary block">Shopify Store</span>
                with Smart Analytics
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                Get actionable insights, predict customer behavior, and optimize your business with our comprehensive analytics platform designed for Shopify merchants.
              </p>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg"
                onClick={() => router.push('/dashboard')}
                className="bg-primary hover:bg-primary/90 px-8 py-3 text-lg group"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="px-8 py-3 text-lg"
              >
                View Demo
              </Button>
            </div>

            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background"></div>
                  <div className="w-8 h-8 rounded-full bg-green-500/20 border-2 border-background"></div>
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 border-2 border-background"></div>
                </div>
                <span>Trusted by 1000+ stores</span>
              </div>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-1">4.9/5 rating</span>
              </div>
            </div>
          </div>

          {/* Right Content - Dashboard Preview */}
          <div className="relative">
            <div className="relative z-10">
              <Image
                src="https://assets.co.dev/759bc4ff-8aed-4306-bc33-f566f278a055/image-6d0e83d.png"
                alt="EchoIQ Dashboard Preview"
                width={600}
                height={400}
                className="rounded-lg shadow-2xl border"
                priority
              />
            </div>
            {/* Background decoration */}
            <div className="absolute -top-4 -right-4 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Grow
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive analytics suite designed to help Shopify merchants make data-driven decisions
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-background">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-foreground text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">1000+</div>
              <div className="text-muted-foreground">Active Stores</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">$50M+</div>
              <div className="text-muted-foreground">Revenue Analyzed</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">25%</div>
              <div className="text-muted-foreground">Average Growth</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">99.9%</div>
              <div className="text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h3 className="text-3xl lg:text-4xl font-bold">
              Ready to Unlock Your Store's Potential?
            </h3>
            <p className="text-xl text-primary-foreground/80">
              Join thousands of successful Shopify merchants who trust EchoIQ to drive their growth
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => router.push('/dashboard')}
                className="bg-background text-primary hover:bg-background/90 px-8 py-3 text-lg"
              >
                Start Your Free Trial
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 px-8 py-3 text-lg"
              >
                Schedule Demo
              </Button>
            </div>
            <p className="text-sm text-primary-foreground/60">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">EchoIQ</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 EchoIQ. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}