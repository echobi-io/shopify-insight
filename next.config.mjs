/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["assets.co.dev", "images.unsplash.com"],
  },
  webpack: (config, context) => {
    // Disable minification to prevent React error #31 in production
    config.optimization.minimize = false;
    return config;
  },
  async headers() {
    return [
      {
        // Apply CSP headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.shopify.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.supabase.co https://*.myshopify.com https://api.openai.com https://api.stripe.com https://monorail-edge.shopifysvc.com https://*.shopifycloud.com",
              "frame-ancestors 'self' https://*.myshopify.com https://admin.shopify.com https://accounts.shopify.com",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://accounts.shopify.com",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ],
      },
    ];
  },
};

export default nextConfig;
