import type { AppProps } from 'next/app'
import { AuthProvider } from '@/contexts/AuthContext'
import { ShopProvider } from '@/contexts/ShopContext'
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'
import { SubscriptionGuard } from '@/components/SubscriptionGuard'
import { ShopifyAppBridge } from '@/components/ShopifyAppBridge'
import { ShopifyAuthHandler } from '@/components/ShopifyAuthHandler'
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
    let isMounted = true;

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
        if (isMounted) {
          setMounted(true);
        }
      }
    };

    // Call async function but don't return the Promise
    initializeApp().catch(error => {
      console.error('App initialization failed:', error);
      if (isMounted) {
        setMounted(true);
      }
    });

    // Cleanup function
    return () => {
      isMounted = false;
    };
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
                      router.pathname.startsWith('/settings') ||
                      router.pathname.startsWith('/subscription')

  // Check for development bypass
  const isDevelopmentBypass = process.env.NEXT_PUBLIC_CO_DEV_ENV === 'development' || 
    (typeof window !== 'undefined' && localStorage.getItem('dev-bypass-auth') === 'true') ||
    (typeof window !== 'undefined' && localStorage.getItem('dev-admin-mode') === 'true');

  // Routes that don't require subscription (public pages, install flow, subscription pages)
  const publicRoutes = [
    '/',
    '/install',
    '/subscription',
    '/subscription/success'
  ];

  // In development bypass mode, add all routes as public to skip subscription guard
  const developmentPublicRoutes = isDevelopmentBypass ? [
    ...publicRoutes,
    '/dashboard',
    '/sales-analysis',
    '/customer-insights',
    '/product-insights',
    '/churn-analytics',
    '/churn-ltv',
    '/churn-predictions',
    '/cohort-analysis',
    '/reports',
    '/settings'
  ] : publicRoutes;
  
  const isPublicRoute = developmentPublicRoutes.includes(router.pathname) || 
                       router.pathname.startsWith('/auth/shopify') ||
                       router.pathname.startsWith('/api/') ||
                       router.pathname.startsWith('/reports/');

  // For Shopify app routes, use ShopProvider
  if (isShopifyApp) {
    return (
      <div className="min-h-screen">
        <ShopProvider>
          <SubscriptionProvider>
            <ShopifyAuthHandler>
              <ShopifyAppBridge>
                <ErrorBoundary>
                  {isPublicRoute ? (
                    <Component {...pageProps} />
                  ) : (
                    <SubscriptionGuard>
                      <Component {...pageProps} />
                    </SubscriptionGuard>
                  )}
                </ErrorBoundary>
                <Toaster />
              </ShopifyAppBridge>
            </ShopifyAuthHandler>
          </SubscriptionProvider>
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
