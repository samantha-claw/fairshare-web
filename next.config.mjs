/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable SWC for Android/Termux compatibility
  swcMinify: false,
  
  // Use Babel instead of SWC
  experimental: {
    // This forces Next.js to use Babel instead of SWC
    forceSwcTransforms: false,
  },
  
  // Other config
  reactStrictMode: true,
  
  // Image optimization
  images: {
    domains: ['lh3.googleusercontent.com'],
    unoptimized: false,
  },
};

export default nextConfig;
