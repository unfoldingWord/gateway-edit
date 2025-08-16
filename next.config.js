/** @type {import('next').NextConfig} */
module.exports = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /canvas/,
      })
    );

    if (!isServer) {
      // Use worker-loader for .worker.js files - only for client-side bundle
      config.module.rules.push({
        test: /\.worker\.(js|ts)$/,
        use: {
          loader: 'worker-loader',
          options: {
            filename: 'static/chunks/[name].[contenthash].worker.js',
            publicPath: '/_next/',
            esModule: false,
            inline: 'no-fallback'
          }
        }
      });
    }

    // Fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    return config;
  },
  experimental: {
    esmExternals: 'loose',
  }
};
