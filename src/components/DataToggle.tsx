import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Database, TestTube, AlertCircle } from 'lucide-react';

interface DataToggleProps {
  useLiveData: boolean;
  onToggle: (useLive: boolean) => void;
  hasLiveData: boolean;
  dataStatus: {
    kpis: boolean;
    revenue: boolean;
    products: boolean;
    segments: boolean;
    channels: boolean;
    productPerformance: boolean;
  };
}

export default function DataToggle({ 
  useLiveData, 
  onToggle, 
  hasLiveData, 
  dataStatus 
}: DataToggleProps) {
  const liveDataCount = Object.values(dataStatus).filter(Boolean).length;
  const totalDataSources = Object.keys(dataStatus).length;

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {useLiveData ? (
                <Database className="w-4 h-4 text-green-600" />
              ) : (
                <TestTube className="w-4 h-4 text-blue-600" />
              )}
              <span className="font-medium">
                {useLiveData ? 'Live Supabase Data' : 'Demo Mode'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge 
                variant={useLiveData ? "default" : "secondary"}
                className="text-xs"
              >
                {useLiveData ? 'Production' : 'Demo'}
              </Badge>
              
              {useLiveData && (
                <Badge 
                  variant={liveDataCount === totalDataSources ? "default" : "destructive"}
                  className="text-xs"
                >
                  {liveDataCount}/{totalDataSources} Live
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {useLiveData && liveDataCount < totalDataSources && (
              <div className="flex items-center space-x-1 text-orange-600">
                <AlertCircle className="w-3 h-3" />
                <span className="text-xs">Partial data</span>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Demo</span>
              <Switch
                checked={useLiveData}
                onCheckedChange={onToggle}
                disabled={!hasLiveData && useLiveData}
              />
              <span className="text-sm text-muted-foreground">Live</span>
            </div>
          </div>
        </div>

        {useLiveData && liveDataCount < totalDataSources && (
          <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-950 rounded-md">
            <p className="text-xs text-orange-700 dark:text-orange-300">
              Some data sources are using fallback demo data. 
              Missing: {Object.entries(dataStatus)
                .filter(([_, hasData]) => !hasData)
                .map(([key]) => key)
                .join(', ')}
            </p>
          </div>
        )}

        {!useLiveData && (
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950 rounded-md">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Demo mode active - showing example data for development and testing purposes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}