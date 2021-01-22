module.exports = {
  target: 'serverless',
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Note: we provide webpack above so you should not `require` it
    // Perform customizations to webpack config
    config.plugins.push(new webpack.IgnorePlugin(/canvas/))
    // Fixes npm packages that depend on `fs` module
    config.node = {
      fs: 'empty',
    }
    // Important: return the modified config
    return config
  },
}
