import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;
  
  // Check if request is coming from Shopify iframe
  const referer = request.headers.get('referer') || '';
  const isFromShopify = referer.includes('shopify.com') || referer.includes('myshopify.com');
  
  // Add security headers for all requests
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Allow embedding from Shopify domains for specific routes
  const isShopifyRoute = pathname.startsWith('/dashboard') || 
                        pathname.startsWith('/sales-analysis') ||
                        pathname.startsWith('/customer-insights') ||
                        pathname.startsWith('/product-insights') ||
                        pathname.startsWith('/churn-') ||
                        pathname.startsWith('/cohort-analysis') ||
                        pathname.startsWith('/reports') ||
                        pathname.startsWith('/settings') ||
                        pathname.startsWith('/subscription');

  // Set X-Frame-Options based on context
  if (isShopifyRoute || isFromShopify) {
    // Allow framing from Shopify for app routes
    response.headers.delete('X-Frame-Options'); // Remove restrictive header
  } else {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  }

  // Create more permissive CSP for Shopify context
  let csp;
  if (isShopifyRoute || isFromShopify) {
    csp = [
      "default-src 'self' https:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "style-src 'self' 'unsafe-inline' https:",
      "font-src 'self' https:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https:",
      "frame-src 'self' https:",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ');
  } else {
    csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.shopify.com https://assets.co.dev",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co https://*.myshopify.com https://api.openai.com https://api.stripe.com",
      "frame-ancestors 'self' https://*.myshopify.com https://admin.shopify.com https://accounts.shopify.com",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://accounts.shopify.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ');
  }

  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};