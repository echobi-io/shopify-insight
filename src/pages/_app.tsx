import type { AppProps } from 'next/app'
import { AuthProvider } from '@/contexts/AuthContext'
import '../styles/globals.css';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary'
import { Toaster } from "@/components/ui/toaster"
import { useEffect, useState } from 'react';
import { initializeCurrencySettings } from '@/lib/utils/currencyUtils'

export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const colorScheme = computedStyle.getPropertyValue('--mode').trim().replace(/"/g, '');
    if (colorScheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
    }
    
    // Initialize currency settings cache
    initializeCurrencySettings().catch(error => {
      console.error('Failed to initialize currency settings:', error);
    });
    
    setMounted(true);
  }, []);

  // Prevent flash while theme loads
  if (!mounted) {
    return null;
  }

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