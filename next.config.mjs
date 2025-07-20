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
  }
};

export default nextConfig;
