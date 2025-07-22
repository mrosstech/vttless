const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add fallbacks only for specific modules that need them
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "stream": require.resolve("stream-browserify"),
        "util": require.resolve("util"),
        "buffer": require.resolve("buffer"),
        "process": require.resolve("process/browser.js"),
        "crypto": false,
        "fs": false,
        "path": false,
        "os": false
      };

      // Add provide plugin
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser.js',
          Buffer: ['buffer', 'Buffer'],
        })
      );

      return webpackConfig;
    },
  },
};