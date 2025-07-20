import React from 'react';
import { useRouter } from 'next/router';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Lock, Loader2 } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { isActive, isLoading } = useSubscription();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Checking subscription...</span>
        </div>
      </div>
    );
  }

  if (!isActive) {
    const { shop } = router.query;
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-xl">Subscription Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              You need an active subscription to access echoSignal's analytics features.
            </p>
            <Button
              onClick={() => router.push(`/subscription${shop ? `?shop=${shop}` : ''}`)}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Subscribe Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}