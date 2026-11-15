/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Prevent ESLint warnings from failing production build on Vercel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type checking is verified via npx tsc
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
