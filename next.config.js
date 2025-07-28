/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // バンドルサイズ最適化
    optimizePackageImports: ['lucide-react', 'react-signature-canvas'],
  },
  // コンソールログを本番環境でも有効化
  env: {
    NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV,
  },
  // ログレベルを設定
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // バンドル最適化
  bundlePagesRouterDependencies: true,
  
  webpack: (config, { isServer, dev }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // 重いライブラリを server-side でのみロード
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@sparticuz/chromium': false,
        'puppeteer-core': false,
        'puppeteer': false,
        '@azure/cognitiveservices-computervision': false,
        '@azure/ms-rest-js': false,
      };
    }

    // 本番環境でのバンドル最適化
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // 重いライブラリを分離
            heavy: {
              test: /[\\/]node_modules[\\/](@sparticuz\/chromium|puppeteer|@azure|openai)[\\/]/,
              name: 'heavy-libs',
              chunks: 'all',
              priority: 10,
            },
            // UIライブラリを分離
            ui: {
              test: /[\\/]node_modules[\\/](react|react-dom|lucide-react)[\\/]/,
              name: 'ui-libs',
              chunks: 'all',
              priority: 8,
            },
          },
        },
      };
    }

    return config;
  },
}

module.exports = nextConfig