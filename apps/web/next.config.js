/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@extracted/extractor', '@extracted/types'],
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', 'mongodb'],
  },
};

module.exports = nextConfig;
