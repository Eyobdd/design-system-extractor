/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@extracted/extractor', '@extracted/types'],
  experimental: {
    serverComponentsExternalPackages: [
      'puppeteer',
      'puppeteer-core',
      '@sparticuz/chromium',
      'mongodb',
    ],
  },
  // Webpack configuration for Puppeteer compatibility
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude puppeteer and chromium from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'puppeteer-core': 'commonjs puppeteer-core',
        '@sparticuz/chromium': 'commonjs @sparticuz/chromium',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
