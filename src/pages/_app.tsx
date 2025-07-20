import type { AppProps } from 'next/app'
import { AuthProvider } from '@/contexts/AuthContext'
import { ShopProvider } from '@/contexts/ShopContext'
import '../styles/globals.css';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary'
import { Toaster } from "@/components/ui/toaster"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { initializeCurrencySettings } from '@/lib/utils/currencyUtils'

export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
  const initializeApp = async () => {
    try {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      const colorScheme = computedStyle.getPropertyValue('--mode').trim().replace(/"/g, '');
      if (colorScheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.add('light');
      }
      
      // Initialize currency settings cache
      await initializeCurrencySettings();
    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      setMounted(true);
    }
  };

  initializeApp();
}, []);


  // Prevent flash while theme loads
  if (!mounted) {
    return null;
  }

  // Check if this is a Shopify app route (has shop parameter or is install/auth page)
  const isShopifyApp = router.query.shop || 
                      router.pathname.startsWith('/install') || 
                      router.pathname.startsWith('/auth/shopify') ||
                      router.pathname === '/' || // Landing page should use Shopify flow
                      router.pathname.startsWith('/dashboard') || // Dashboard should be Shopify-aware
                      router.pathname.startsWith('/sales-analysis') ||
                      router.pathname.startsWith('/customer-insights') ||
                      router.pathname.startsWith('/product-insights') ||
                      router.pathname.startsWith('/churn-') ||
                      router.pathname.startsWith('/cohort-analysis') ||
                      router.pathname.startsWith('/reports') ||
                      router.pathname.startsWith('/settings')

  // For Shopify app routes, use ShopProvider
  if (isShopifyApp) {
    return (
      <div className="min-h-screen">
        <ShopProvider>
          <ErrorBoundary>
            <Component {...pageProps} />
          </ErrorBoundary>
          <Toaster />
        </ShopProvider>
      </div>
    )
  }

  // For regular auth routes, use AuthProvider
  return (
    <div className="min-h-screen">
      <AuthProvider>
        <ProtectedRoute>
          <ErrorBoundary>
            <Component {...pageProps} />
          </ErrorBoundary>
        </ProtectedRoute>
        <Toaster />
      </AuthProvider>
    </div>
  )
}
