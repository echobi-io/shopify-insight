import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface SubscriptionContextType {
  isActive: boolean;
  status: string;
  isLoading: boolean;
  checkSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('inactive');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for development bypass
  const isDevelopmentBypass = process.env.NEXT_PUBLIC_CO_DEV_ENV === 'development' || 
    (typeof window !== 'undefined' && localStorage.getItem('dev-bypass-auth') === 'true') ||
    (typeof window !== 'undefined' && localStorage.getItem('dev-admin-mode') === 'true');

  const checkSubscription = async () => {
    console.log('SubscriptionContext: Checking subscription...');
    console.log('SubscriptionContext: Environment variable NEXT_PUBLIC_CO_DEV_ENV:', process.env.NEXT_PUBLIC_CO_DEV_ENV);
    console.log('SubscriptionContext: localStorage dev-bypass-auth:', typeof window !== 'undefined' ? localStorage.getItem('dev-bypass-auth') : 'N/A (server)');
    console.log('SubscriptionContext: localStorage dev-admin-mode:', typeof window !== 'undefined' ? localStorage.getItem('dev-admin-mode') : 'N/A (server)');
    console.log('SubscriptionContext: isDevelopmentBypass:', isDevelopmentBypass);

    // If development bypass is enabled, always return active subscription
    if (isDevelopmentBypass) {
      console.log('Development bypass enabled - subscription check bypassed');
      setIsActive(true);
      setStatus('active');
      setIsLoading(false);
      return;
    }
=======

    const { shop } = router.query;
    
    if (!shop || typeof shop !== 'string') {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/subscription/status?shop=${encodeURIComponent(shop)}`);
      const data = await response.json();
      
      setIsActive(data.isActive);
      setStatus(data.status);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsActive(false);
      setStatus('inactive');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (router.isReady) {
      checkSubscription();
    }
  }, [router.isReady, router.query.shop]);

  return (
    <SubscriptionContext.Provider value={{ isActive, status, isLoading, checkSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}