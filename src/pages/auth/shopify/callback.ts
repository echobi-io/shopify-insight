import { NextApiRequest, NextApiResponse } from 'next';
import { ShopifyAuth, SessionManager } from '@/lib/shopify/auth';
import { DataSyncService } from '@/lib/services/syncService';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    // Start initial data sync in the background
    DataSyncService.syncShopData(shopDomain).catch(error => {
      console.error('Initial sync failed:', error);
      // Don't fail the OAuth flow if sync fails
    });

    // Check if user is already subscribed from database
    const { subscribed } = req.query;
    let isSubscribed = subscribed === 'true';
    
    // If not explicitly subscribed via query param, check database
    if (!isSubscribed) {
      try {
        const supabase = createClient();
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
    
    // For embedded apps, we need to use App Bridge for navigation
    const embedRedirectHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting...</title>
          <script src="https://unpkg.com/@shopify/app-bridge@3"></script>
        </head>
        <body>
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              if (window.top !== window.self) {
                // We're in an iframe, use App Bridge
                const app = window.AppBridge.createApp({
                  apiKey: '${process.env.NEXT_PUBLIC_SHOPIFY_API_KEY}',
                  host: '${Buffer.from(shopDomain).toString('base64')}'
                });
                
                const redirect = window.AppBridge.actions.Redirect.create(app);
                redirect.dispatch(window.AppBridge.actions.Redirect.Action.REMOTE, '${redirectUrl}');
              } else {
                // Not in iframe, regular redirect
                window.location.href = '${redirectUrl}';
              }
            });
          </script>
          <p>Redirecting to echoSignal...</p>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(embedRedirectHtml);

  } catch (error) {
    console.error('OAuth callback error:', error);
    
    // Redirect to error page with error message
    const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/error?message=${encodeURIComponent(
      error instanceof Error ? error.message : 'OAuth authentication failed'
    )}`;
    
    res.redirect(302, errorUrl);
  }
}