const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Production optimizations
      if (env === 'production') {
        // Optimize bundle splitting
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
                maxSize: 244000, // 244KB
              },
              mui: {
                test: /[\\/]node_modules[\\/]@mui[\\/]/,
                name: 'mui',
                chunks: 'all',
                priority: 10,
              },
              mapbox: {
                test: /[\\/]node_modules[\\/](mapbox-gl|@mapbox)[\\/]/,
                name: 'mapbox',
                chunks: 'all',
                priority: 10,
              },
              fullcalendar: {
                test: /[\\/]node_modules[\\/]@fullcalendar[\\/]/,
                name: 'fullcalendar',
                chunks: 'all',
                priority: 10,
              },
              apollo: {
                test: /[\\/]node_modules[\\/]@apollo[\\/]/,
                name: 'apollo',
                chunks: 'all',
                priority: 10,
              },
            },
          },
        };

        // Bundle analyzer (only when needed)
        if (process.env.REACT_APP_BUNDLE_ANALYZER === 'true') {
          webpackConfig.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              openAnalyzer: false,
              reportFilename: 'bundle-report.html',
            })
          );
        }

        // Memory optimization
        webpackConfig.optimization.concatenateModules = false;
        
        // Reduce parallel processing to save memory
        webpackConfig.parallelism = 1;
      }

      return webpackConfig;
    },
  },
};
