import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export function DevBypassToggle() {
  const [isDevBypass, setIsDevBypass] = useState(false);
  const [isEnvBypass, setIsEnvBypass] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check current state
    const localStorageBypass = typeof window !== 'undefined' && localStorage.getItem('dev-bypass-auth') === 'true';
    const envBypass = process.env.NEXT_PUBLIC_CO_DEV_ENV === 'development';
    
    setIsDevBypass(localStorageBypass);
    setIsEnvBypass(envBypass);
  }, []);

  const toggleDevBypass = () => {
    if (typeof window !== 'undefined') {
      const newState = !isDevBypass;
      if (newState) {
        localStorage.setItem('dev-bypass-auth', 'true');
        toast({
          title: "Development Bypass Enabled",
          description: "Authentication and subscription will be bypassed. Refresh the page to apply changes.",
        });
      } else {
        localStorage.removeItem('dev-bypass-auth');
        toast({
          title: "Development Bypass Disabled",
          description: "Normal authentication and subscription will be required. Refresh the page to apply changes.",
        });
      }
      setIsDevBypass(newState);
    }
  };

  const refreshPage = () => {
    window.location.reload();
  };

  // Only show in development environment
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Development Tools
          <Badge variant="secondary">DEV ONLY</Badge>
        </CardTitle>
        <CardDescription>
          Toggle authentication and subscription bypass for development purposes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="env-bypass">Environment Bypass</Label>
            <Badge variant={isEnvBypass ? "default" : "secondary"}>
              {isEnvBypass ? "ACTIVE" : "INACTIVE"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Controlled by NEXT_PUBLIC_CO_DEV_ENV environment variable
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="local-bypass">Local Storage Bypass</Label>
            <Switch
              id="local-bypass"
              checked={isDevBypass}
              onCheckedChange={toggleDevBypass}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Toggle authentication and subscription bypass using localStorage
          </p>
        </div>

        <div className="pt-2">
          <Button onClick={refreshPage} className="w-full" variant="outline">
            Refresh Page to Apply Changes
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Current Status:</strong></p>
          <p>• Environment: {isEnvBypass ? '✅ Bypassed' : '❌ Normal'}</p>
          <p>• Local Storage: {isDevBypass ? '✅ Bypassed' : '❌ Normal'}</p>
          <p>• Authentication: {(isEnvBypass || isDevBypass) ? '✅ Bypassed' : '❌ Required'}</p>
          <p>• Subscription: {(isEnvBypass || isDevBypass) ? '✅ Bypassed' : '❌ Required'}</p>
        </div>
      </CardContent>
    </Card>
  );
}