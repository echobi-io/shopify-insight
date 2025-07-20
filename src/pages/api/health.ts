import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/component';

const supabase = createClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const healthChecks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {
        database: { status: 'unknown', latency: 0 },
        environment: { status: 'unknown', missing: [] as string[] },
        shopify: { status: 'unknown' }
      }
    };

    // Check database connection
    const dbStart = Date.now();
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('count')
        .limit(1);
      
      healthChecks.checks.database = {
        status: error ? 'unhealthy' : 'healthy',
        latency: Date.now() - dbStart
      };
    } catch (error) {
      healthChecks.checks.database = {
        status: 'unhealthy',
        latency: Date.now() - dbStart
      };
    }

    // Check required environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SHOPIFY_API_KEY',
      'SHOPIFY_API_SECRET',
      'SHOPIFY_WEBHOOK_SECRET',
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'DATABASE_URL'
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    healthChecks.checks.environment = {
      status: missingEnvVars.length === 0 ? 'healthy' : 'unhealthy',
      missing: missingEnvVars
    };

    // Check Shopify configuration
    const hasShopifyConfig = !!(
      process.env.NEXT_PUBLIC_SHOPIFY_API_KEY && 
      process.env.SHOPIFY_API_SECRET && 
      process.env.SHOPIFY_WEBHOOK_SECRET
    );

    healthChecks.checks.shopify = {
      status: hasShopifyConfig ? 'healthy' : 'unhealthy'
    };

    // Determine overall status
    const allHealthy = Object.values(healthChecks.checks).every(check => check.status === 'healthy');
    healthChecks.status = allHealthy ? 'healthy' : 'unhealthy';

    const statusCode = allHealthy ? 200 : 503;
    res.status(statusCode).json(healthChecks);

  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        database: { status: 'unknown' },
        environment: { status: 'unknown' },
        shopify: { status: 'unknown' }
      }
    });
  }
}