import React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Target, 
  Zap,
  ArrowRight,
  CheckCircle,
  Star,
  Brain,
  PieChart,
  Activity
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: "easeOut" }
};

export default function Home() {
  return (
    <>
      <Head>
        <title>ShopifyIQ - Advanced Analytics for Shopify Stores</title>
        <meta name="description" content="Transform your Shopify store with AI-powered analytics. Predict churn, optimize LTV, and boost revenue with actionable insights." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="bg-background min-h-screen">
        {/* Navigation */}
        <motion.nav 
          className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">ShopifyIQ</span>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button>Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.nav>

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            <motion.div 
              className="text-center"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <motion.div variants={fadeInUp}>
                <Badge variant="secondary" className="mb-4">
                  <Zap className="w-3 h-3 mr-1" />
                  AI-Powered Analytics
                </Badge>
              </motion.div>
              
              <motion.h1 
                className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight"
                variants={fadeInUp}
              >
                Transform Your Shopify Store with
                <span className="text-primary block">Predictive Analytics</span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto"
                variants={fadeInUp}
              >
                Stop guessing, start knowing. Our AI-powered platform predicts customer churn, 
                optimizes lifetime value, and delivers actionable insights that drive real revenue growth.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                variants={fadeInUp}
              >
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Watch Demo
                </Button>
                <Link href="/dashboard">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    Admin Dashboard
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Hero Image */}
            <motion.div 
              className="mt-16 relative"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="relative rounded-2xl overflow-hidden border border-border/50">
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                  alt="Analytics Dashboard"
                  className="w-full h-[400px] md:h-[600px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Everything you need to grow smarter
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Powerful analytics tools designed specifically for Shopify merchants who want to scale intelligently.
              </p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {[
                {
                  icon: Brain,
                  title: "AI-Powered Churn Prediction",
                  description: "Identify customers at risk of churning before they leave. Our ML models analyze behavior patterns to predict churn with 95% accuracy."
                },
                {
                  icon: TrendingUp,
                  title: "Lifetime Value Optimization",
                  description: "Maximize customer LTV with personalized recommendations and targeted retention strategies based on predictive modeling."
                },
                {
                  icon: Users,
                  title: "Advanced Customer Segmentation",
                  description: "Automatically segment customers by behavior, value, and risk. Create targeted campaigns that actually convert."
                },
                {
                  icon: PieChart,
                  title: "Revenue Forecasting",
                  description: "Plan ahead with accurate revenue predictions. Our Prophet-based models help you make informed business decisions."
                },
                {
                  icon: Activity,
                  title: "Real-time Performance Tracking",
                  description: "Monitor your store's health with live dashboards. Get instant alerts when metrics change significantly."
                },
                {
                  icon: Target,
                  title: "Actionable Insights",
                  description: "No more guesswork. Get clear, actionable recommendations backed by data science and proven to drive results."
                }
              ].map((feature, index) => (
                <motion.div key={index} variants={scaleIn}>
                  <Card className="h-full border-border/50 hover:border-border transition-colors">
                    <CardHeader>
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                        <feature.icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                      <CardDescription className="text-base leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Trusted by growing Shopify stores
              </h2>
              <div className="flex items-center justify-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2 text-muted-foreground">4.9/5 from 500+ merchants</span>
              </div>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {[
                {
                  metric: "35%",
                  label: "Average increase in customer retention",
                  image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                },
                {
                  metric: "2.4x",
                  label: "Improvement in customer lifetime value",
                  image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                },
                {
                  metric: "50%",
                  label: "Reduction in customer acquisition cost",
                  image: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                }
              ].map((stat, index) => (
                <motion.div key={index} variants={scaleIn}>
                  <Card className="overflow-hidden border-border/50">
                    <div className="relative h-48">
                      <img 
                        src={stat.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <div className="text-3xl font-bold text-foreground">{stat.metric}</div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to transform your Shopify analytics?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join hundreds of merchants who've already boosted their revenue with ShopifyIQ.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/signup">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Start Your Free Trial
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <div className="flex items-center space-x-2 text-sm opacity-75">
                  <CheckCircle className="w-4 h-4" />
                  <span>No credit card required</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/40 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">ShopifyIQ</span>
              </div>
              <div className="text-sm text-muted-foreground">
                © 2024 ShopifyIQ. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}