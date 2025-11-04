const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      // Add resolve paths from jsconfig.json
      webpackConfig.resolve.modules = [
        ...(webpackConfig.resolve.modules || []),
        path.resolve(__dirname, 'src'),
        path.resolve(__dirname, '../node_modules'), // Add root node_modules for workspace hoisting
      ];
      
      // Ensure TypeScript files are resolved (add before existing extensions)
      const extensions = webpackConfig.resolve.extensions || [];
      if (!extensions.includes('.ts')) {
        webpackConfig.resolve.extensions = ['.ts', '.tsx', ...extensions];
      }
      
      return webpackConfig;
    },
  },
};

