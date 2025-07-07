import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import { createClient } from '@/util/supabase/component';
import { User, Provider } from '@supabase/supabase-js';
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from 'next/router';
import { getSettingsSync } from '@/lib/utils/settingsUtils';

const DEFAULT_MERCHANT_ID = '11111111-1111-1111-1111-111111111111';

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

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for dev admin mode first
        const devAdminMode = typeof window !== 'undefined' && localStorage.getItem('dev-admin-mode') === 'true';
        
        if (devAdminMode) {
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
          setMerchantId(DEFAULT_MERCHANT_ID);
          setIsDevAdmin(true);
          setInitializing(false);
          return;
        }

        // Check for real Supabase session
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        // For any authenticated user, use the hardcoded merchant ID
        if (user) {
          setMerchantId(DEFAULT_MERCHANT_ID);
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

    initializeAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Don't override dev admin session
      const devAdminMode = typeof window !== 'undefined' && localStorage.getItem('dev-admin-mode') === 'true';
      if (devAdminMode) return;

      setUser(session?.user ?? null);
      setMerchantId(session?.user ? DEFAULT_MERCHANT_ID : null);
      setIsDevAdmin(false);
      setInitializing(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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
    // Clear dev admin mode
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dev-admin-mode');
      localStorage.removeItem('dev-admin-merchant-id');
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