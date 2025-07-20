import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { SessionManager, ShopifySession } from '@/lib/shopify/auth';
import { useToast } from "@/components/ui/use-toast";

// Import sync service dynamically to avoid circular dependencies
let DataSyncService: any = null;

// Lazy load the sync service
const loadSyncService = async () => {
  if (!DataSyncService) {
    try {
      const module = await import('@/lib/services/syncService');
      DataSyncService = module.DataSyncService;
    } catch (error) {
      console.error('Failed to load sync service:', error);
    }
  }
};

interface SyncProgress {
  stage: 'orders' | 'products' | 'customers' | 'complete';
  processed: number;
  total: number;
  errors: string[];
}

interface ShopContextType {
  shop: string | null;
  session: ShopifySession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  syncProgress: SyncProgress | null;
  isSyncing: boolean;
  initializeShop: (shopDomain: string) => Promise<void>;
  startSync: () => Promise<void>;
  clearShop: () => void;
}

export const ShopContext = createContext<ShopContextType>({
  shop: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  syncProgress: null,
  isSyncing: false,
  initializeShop: async () => {},
  startSync: async () => {},
  clearShop: () => {}
});

export function ShopProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [shop, setShop] = useState<string | null>(null);
  const [session, setSession] = useState<ShopifySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const isAuthenticated = !!(shop && session?.isActive);

  useEffect(() => {
    // Skip if router is not ready
    if (!router.isReady) {
      return;
    }

    let isMounted = true;

    // Wrap async function to prevent Promise leakage
    const initializeFromUrl = async () => {
      try {
        if (!isMounted) return;
        setIsLoading(true);
        
        // Get shop from URL params
        const { shop: shopParam } = router.query;
        
        if (shopParam && typeof shopParam === 'string') {
          try {
            if (isMounted) {
              await initializeShop(shopParam);
            }
          } catch (initError) {
            console.error('Failed to initialize shop from URL param:', initError);
            // Don't throw, just log and continue
          }
        } else {
          // Try to get from stored session
          try {
            const storedSession = await SessionManager.getCurrentSession();
            if (storedSession && isMounted) {
              await initializeShop(storedSession.shop);
            }
          } catch (sessionError) {
            console.log('No stored session found:', sessionError);
            // This is expected when no session exists, don't treat as error
          }
        }
      } catch (error) {
        console.error('Failed to initialize shop context:', error);
        // Only show toast if we have a toast function available and component is still mounted
        if (isMounted) {
          try {
            toast({
              variant: "destructive",
              title: "Authentication Error",
              description: "Failed to authenticate with your Shopify store. Please try reinstalling the app.",
            });
          } catch (toastError) {
            console.error('Failed to show toast:', toastError);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Call the async function but don't return the Promise
    initializeFromUrl().catch(error => {
      console.error('Unhandled error in shop initialization:', error);
      if (isMounted) {
        setIsLoading(false);
      }
    });

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [router.isReady, router.query]);

  const initializeShop = async (shopDomain: string): Promise<void> => {
    try {
      console.log('Initializing shop:', shopDomain);
      
      // Get session for this shop
      const shopSession = await SessionManager.getSession(shopDomain);
      
      if (!shopSession) {
        console.error('No session found for shop:', shopDomain);
        // Redirect to installation page - don't await this
        router.push(`/install?shop=${encodeURIComponent(shopDomain)}`).catch(routerError => {
          console.error('Router push failed:', routerError);
        });
        return;
      }

      setShop(shopDomain);
      setSession(shopSession);

      // Update URL if needed (without causing a reload) - don't await this
      if (router.query.shop !== shopDomain) {
        const currentPath = router.asPath.split('?')[0];
        router.replace(
          `${currentPath}?shop=${encodeURIComponent(shopDomain)}`,
          undefined,
          { shallow: true }
        ).catch(routerError => {
          console.error('Router replace failed:', routerError);
        });
      }

      console.log('Shop context initialized successfully:', shopDomain);
    } catch (error) {
      console.error('Error initializing shop:', error);
      // Don't throw the error, just log it
      return;
    }
  };

  const startSync = async (): Promise<void> => {
    if (!shop || isSyncing) return;

    try {
      setIsSyncing(true);
      setSyncProgress(null);

      toast({
        title: "Sync Started",
        description: "Starting to sync your store data...",
      });

      // Load sync service dynamically
      await loadSyncService();
      
      if (!DataSyncService) {
        throw new Error('Sync service not available');
      }

      await DataSyncService.syncShopData(shop, (progress: SyncProgress) => {
        setSyncProgress(progress);
        
        // Show progress updates
        if (progress.stage === 'complete') {
          toast({
            title: "Sync Complete",
            description: "Your store data has been successfully synchronized.",
          });
          setSyncProgress(null);
        } else if (progress.errors.length > 0) {
          toast({
            variant: "destructive",
            title: "Sync Warning",
            description: `Some data may not have synced properly: ${progress.errors[0]}`,
          });
        }
      });

    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync store data",
      });
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  const clearShop = (): void => {
    setShop(null);
    setSession(null);
    setSyncProgress(null);
    setIsSyncing(false);
    SessionManager.clearAllSessions();
    
    // Redirect to installation page - don't await this
    router.push('/install').catch(routerError => {
      console.error('Router push failed in clearShop:', routerError);
    });
  };

  return (
    <ShopContext.Provider value={{
      shop,
      session,
      isLoading,
      isAuthenticated,
      syncProgress,
      isSyncing,
      initializeShop,
      startSync,
      clearShop,
    }}>
      {children}
    </ShopContext.Provider>
  );
}

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};

// Higher-order component for protecting routes that require shop authentication
export function withShopAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.ComponentType<P> {
  const ShopAuthComponent: React.FC<P> = (props) => {
    const { isAuthenticated, isLoading, shop } = useShop();
    const router = useRouter();

    useEffect(() => {
      // Only redirect if we're not loading and not authenticated
      if (!isLoading && !isAuthenticated) {
        const redirectUrl = `/install${shop ? `?shop=${encodeURIComponent(shop)}` : ''}`;
        // Don't await the router.push to prevent returning a Promise
        router.push(redirectUrl).catch(routerError => {
          console.error('Router push failed in withShopAuth:', routerError);
        });
      }
    }, [isAuthenticated, isLoading, shop, router]);

    // Always return JSX, never a Promise
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Redirecting to installation...</p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  // Set display name for debugging
  ShopAuthComponent.displayName = `withShopAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return ShopAuthComponent;
}

// Hook for getting shop-specific data fetchers
export function useShopDataFetcher() {
  const { shop, session } = useShop();

  const createShopAwareUrl = (baseUrl: string, params?: Record<string, any>) => {
    const url = new URL(baseUrl, window.location.origin);
    
    if (shop) {
      url.searchParams.set('shop', shop);
    }
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, value.toString());
        }
      });
    }
    
    return url.toString();
  };

  const fetchShopData = async (endpoint: string, options?: RequestInit) => {
    if (!shop || !session) {
      throw new Error('No authenticated shop session');
    }

    const url = createShopAwareUrl(endpoint);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Shop-Domain': shop,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  };

  return {
    shop,
    session,
    createShopAwareUrl,
    fetchShopData,
  };
}