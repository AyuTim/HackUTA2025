/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ✅ Vercel build won’t fail due to linting errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
