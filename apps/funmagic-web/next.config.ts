import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  cacheComponents: true,
  cacheLife: {
    tools: {
      stale: 60,
      revalidate: 300,
      expire: 3600,
    },
  },
};

export default withNextIntl(nextConfig);
