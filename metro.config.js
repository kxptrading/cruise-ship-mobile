const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // expo-modules-core fails to resolve for web via the package exports field.
  // Explicitly point it at its source entry to bypass the issue.
  if (moduleName === 'expo-modules-core' && platform === 'web') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(
        __dirname,
        'node_modules/expo-modules-core/src/index.ts',
      ),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;