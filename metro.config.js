const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix for native modules and tslib on web
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // Stub out native BLE and permissions modules on web
    if (platform === 'web') {
      if (moduleName === 'react-native-ble-manager') {
        return {
          type: 'sourceFile',
          filePath: path.resolve(__dirname, 'ble-stub.web.js'),
        };
      }
      if (moduleName === 'react-native-permissions') {
        return {
          type: 'sourceFile',
          filePath: path.resolve(__dirname, 'permissions-stub.web.js'),
        };
      }
      if (moduleName === 'react-native-network-info') {
        return {
          type: 'sourceFile',
          filePath: path.resolve(__dirname, 'networkinfo-stub.web.js'),
        };
      }
      if (moduleName === 'tslib') {
        return {
          type: 'sourceFile',
          filePath: require.resolve('tslib/tslib.js'),
        };
      }
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
