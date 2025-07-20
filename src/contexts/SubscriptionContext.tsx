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

  const checkSubscription = async () => {
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