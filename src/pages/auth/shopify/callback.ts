import { NextApiRequest, NextApiResponse } from 'next';
import { ShopifyAuth, SessionManager } from '@/lib/shopify/auth';
import { SimpleSyncService } from '@/lib/services/simpleSyncService';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Basic validation - only check if objects exist
  if (!req || !res) {
    console.error('Invalid request/response objects in callback handler');
    return;
  }

  // More lenient validation - check if we can use the response object
  try {
    if (typeof res.status !== 'function') {
      console.error('Invalid response object methods in callback handler');
      // Try to handle gracefully without throwing
      return;
    }
  } catch (error) {
    console.error('Error validating response object:', error);
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, shop, state, hmac } = req.query;

    // Validate required parameters
    if (!code || !shop || !state) {
      console.error('Missing required OAuth parameters');
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const shopDomain = ShopifyAuth.extractShopDomain(shop as string);
    
    // Validate shop domain format
    if (!ShopifyAuth.validateShopDomain(shopDomain)) {
      console.error('Invalid shop domain:', shopDomain);
      return res.status(400).json({ error: 'Invalid shop domain' });
    }

    // Verify state parameter (CSRF protection)
    if (!ShopifyAuth.verifyState(state as string)) {
      console.error('Invalid state parameter');
      return res.status(400).json({ error: 'Invalid state parameter' });
    }

    console.log(`Processing OAuth callback for shop: ${shopDomain}`);

    // Exchange authorization code for access token
    const accessToken = await ShopifyAuth.exchangeCodeForToken(shopDomain, code as string);
    
    if (!accessToken) {
      console.error('Failed to obtain access token');
      return res.status(400).json({ error: 'Failed to obtain access token' });
    }

    // Create session in database
    await SessionManager.createSession(
      shopDomain,
      accessToken,
      'read_orders,read_products,read_customers,read_analytics,read_inventory,read_reports'
    );

    console.log(`Session created successfully for shop: ${shopDomain}`);

    // Initialize shop data and settings - don't await to prevent blocking
    SimpleSyncService.initializeShopData(shopDomain).catch(error => {
      console.error('Shop initialization failed:', error);
      // Don't fail the OAuth flow if initialization fails
    });

    // Check if user is already subscribed from database
    const { subscribed } = req.query;
    let isSubscribed = subscribed === 'true';
    
    // If not explicitly subscribed via query param, check database
    if (!isSubscribed) {
      try {
        const supabase = createClient(req, res);
        const { data: subscription, error } = await supabase
          .from('subscription')
          .select('status')
          .eq('shop_domain', shopDomain)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking subscription status:', error);
        }
        
        isSubscribed = subscription?.status === 'active';
      } catch (error) {
        console.error('Error checking subscription status:', error);
        // Default to not subscribed if there's an error
        isSubscribed = false;
      }
    }
    
    // Redirect to subscription page if not subscribed, otherwise to dashboard
    const redirectPath = isSubscribed ? '/dashboard' : '/subscription';
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}${redirectPath}?shop=${encodeURIComponent(shopDomain)}`;
    
    console.log(`Redirecting to: ${redirectUrl}`);
    
    // Use writeHead and end for more reliable redirect
    res.writeHead(302, { Location: redirectUrl });
    res.end();

  } catch (error) {
    console.error('OAuth callback error:', error);
    
    try {
      // Redirect to error page with error message
      const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/error?message=${encodeURIComponent(
        error instanceof Error ? error.message : 'OAuth authentication failed'
      )}`;
      
      res.writeHead(302, { Location: errorUrl });
      res.end();
    } catch (redirectError) {
      console.error('Failed to redirect to error page:', redirectError);
      // Fallback response
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}