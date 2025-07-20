import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers for all requests
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Allow embedding from Shopify domains for specific routes
  const pathname = request.nextUrl.pathname;
  const isShopifyRoute = pathname.startsWith('/dashboard') || 
                        pathname.startsWith('/sales-analysis') ||
                        pathname.startsWith('/customer-insights') ||
                        pathname.startsWith('/product-insights') ||
                        pathname.startsWith('/churn-') ||
                        pathname.startsWith('/cohort-analysis') ||
                        pathname.startsWith('/reports') ||
                        pathname.startsWith('/settings') ||
                        pathname.startsWith('/subscription');

  if (isShopifyRoute) {
    // Allow framing from Shopify admin for app routes
    response.headers.set('X-Frame-Options', 'ALLOWALL');
  }

  // Add CSP header with proper directives
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.shopify.com https://assets.co.dev",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://*.myshopify.com https://api.openai.com https://api.stripe.com",
    "frame-ancestors 'self' https://*.myshopify.com https://admin.shopify.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ');

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