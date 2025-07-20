import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useIsIFrame } from '@/hooks/useIsIFrame';

interface ShopifyAppBridgeProps {
  children: React.ReactNode;
}

export function ShopifyAppBridge({ children }: ShopifyAppBridgeProps) {
  const router = useRouter();
  const isIFrame = useIsIFrame();
  const [isShopifyContext, setIsShopifyContext] = useState(false);

  useEffect(() => {
    // Check if we're in a Shopify context
    const { shop } = router.query;
    const hasShopParam = Boolean(shop);
    const isShopifyRoute = router.pathname.startsWith('/dashboard') || 
                          router.pathname.startsWith('/sales-analysis') ||
                          router.pathname.startsWith('/customer-insights') ||
                          router.pathname.startsWith('/product-insights') ||
                          router.pathname.startsWith('/churn-') ||
                          router.pathname.startsWith('/cohort-analysis') ||
                          router.pathname.startsWith('/reports') ||
                          router.pathname.startsWith('/settings') ||
                          router.pathname.startsWith('/subscription');

    setIsShopifyContext(hasShopParam && isShopifyRoute);

    // If we're in an iframe but not in Shopify context, redirect to standalone
    if (isIFrame && !hasShopParam && isShopifyRoute) {
      console.warn('App loaded in iframe without shop parameter, redirecting to standalone');
      window.top?.location.replace(window.location.href);
    }

    // Add body class for styling based on context
    if (isIFrame && isShopifyContext) {
      document.body.classList.add('shopify-embedded');
    } else {
      document.body.classList.remove('shopify-embedded');
    }

    return () => {
      document.body.classList.remove('shopify-embedded');
    };
  }, [router.query, router.pathname, isIFrame]);

  // Handle navigation in Shopify context
  useEffect(() => {
    if (!isShopifyContext) return;

    const handleRouteChange = (url: string) => {
      console.log('Route changing to:', url);
      
      // If we're in an iframe, we might need special handling
      if (isIFrame) {
        console.log('Navigation in iframe context');
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.events, isShopifyContext, isIFrame]);

  return (
    <div className={`shopify-app-wrapper ${isIFrame ? 'iframe-context' : 'standalone-context'}`}>
      {children}
    </div>
  );
}