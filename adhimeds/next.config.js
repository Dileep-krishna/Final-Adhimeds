/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Temporarily disable ESLint during builds if you're in a hurry.
    // Remove this line after fixing the error.
    ignoreDuringBuilds: true,
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

module.exports = nextConfig;