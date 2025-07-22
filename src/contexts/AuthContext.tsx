import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import { createClient } from '@/util/supabase/component';
import { User, Provider } from '@supabase/supabase-js';
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from 'next/router';
import { getSettingsSync } from '@/lib/utils/settingsUtils';
import { SimpleSyncService } from '@/lib/services/simpleSyncService';

interface AuthContextType {
  user: User | null;
  merchantId: string | null;
  createUser: (user: User) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  initializing: boolean;
  isDevAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  merchantId: null,
  createUser: async () => {},
  signIn: async () => {},
  signUp: async () => {},
  signInWithMagicLink: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  initializing: false,
  isDevAdmin: false
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [isDevAdmin, setIsDevAdmin] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  // Function to get merchant ID from shop domain using SimpleSyncService
  const getMerchantIdFromShop = async (shopDomain: string): Promise<string | null> => {
    try {
      return await SimpleSyncService.getMerchantIdFromShop(shopDomain);
    } catch (error) {
      console.error('Error getting merchant ID from shop:', error);
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for development bypass (environment variable or localStorage)
        const isDevelopmentBypass = process.env.NEXT_PUBLIC_CO_DEV_ENV === 'development' || 
          (typeof window !== 'undefined' && localStorage.getItem('dev-bypass-auth') === 'true');
        
        // Also check for legacy dev admin mode
        const devAdminMode = typeof window !== 'undefined' && localStorage.getItem('dev-admin-mode') === 'true';
        
        if (isDevelopmentBypass || devAdminMode) {
          console.log('Development bypass enabled - skipping Supabase authentication');
          
          // Set up dev admin session
          const mockUser = {
            id: 'admin-dev-user',
            email: 'admin@dev.local',
            aud: 'authenticated',
            role: 'authenticated',
            email_confirmed_at: new Date().toISOString(),
            phone: '',
            confirmed_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
            app_metadata: {},
            user_metadata: {},
            identities: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as any;
          
          setUser(mockUser);
          
          // Try to get merchant ID from shop parameter or use fallback
          const shopParam = router.query.shop as string;
          if (shopParam) {
            const merchantIdFromShop = await getMerchantIdFromShop(shopParam);
            setMerchantId(merchantIdFromShop || shopParam); // Use shop domain as fallback
          } else {
            setMerchantId('dev-admin-merchant');
          }
          
          setIsDevAdmin(true);
          setInitializing(false);
          return;
        }

        // Check for real Supabase session
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        // Get merchant ID from shop context if available
        if (user) {
          const shopParam = router.query.shop as string;
          if (shopParam) {
            const merchantIdFromShop = await getMerchantIdFromShop(shopParam);
            setMerchantId(merchantIdFromShop || shopParam); // Use shop domain as fallback
          } else {
            setMerchantId(null);
          }
        } else {
          setMerchantId(null);
        }
        
        setIsDevAdmin(false);
        setInitializing(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setInitializing(false);
      }
    };

    // Only initialize when router is ready
    if (router.isReady) {
      initializeAuth();
    }

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Don't override dev bypass session
      const isDevelopmentBypass = process.env.NEXT_PUBLIC_CO_DEV_ENV === 'development' || 
        (typeof window !== 'undefined' && localStorage.getItem('dev-bypass-auth') === 'true');
      const devAdminMode = typeof window !== 'undefined' && localStorage.getItem('dev-admin-mode') === 'true';
      
      if (isDevelopmentBypass || devAdminMode) return;

      setUser(session?.user ?? null);
      
      // Get merchant ID from shop context if user is authenticated
      if (session?.user) {
        const shopParam = router.query.shop as string;
        if (shopParam) {
          const merchantIdFromShop = await getMerchantIdFromShop(shopParam);
          setMerchantId(merchantIdFromShop || shopParam); // Use shop domain as fallback
        } else {
          setMerchantId(null);
        }
      } else {
        setMerchantId(null);
      }
      
      setIsDevAdmin(false);
      setInitializing(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router.isReady, router.query.shop]);

  const createUser = async (user: User) => {
    // Simplified - just log for now since we're using hardcoded merchant ID
    console.log('User created/signed in:', user.email);
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    } else {
      toast({
        title: "Success",
        description: "You have successfully signed in",
      });
    }
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    } else {
      toast({
        title: "Success",
        description: "Sign up successful! Please check your email to confirm your account.",
      });
    }
  };

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    } else {
      toast({
        title: "Success",
        description: "Check your email for the login link",
      });
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google' as Provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    }
  };

  const signOut = async () => {
    // Clear dev bypass modes
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dev-admin-mode');
      localStorage.removeItem('dev-admin-merchant-id');
      localStorage.removeItem('dev-bypass-auth');
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "You have successfully signed out",
      });
      router.push('/');
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    } else {
      toast({
        title: "Success",
        description: "Check your email for the password reset link",
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      merchantId,
      createUser,
      signIn,
      signUp,
      signInWithMagicLink,
      signInWithGoogle,
      signOut,
      resetPassword,
      initializing,
      isDevAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);