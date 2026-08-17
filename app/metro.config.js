const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Redirect @react-native-async-storage/async-storage (pulled in transitively
// by supertokens-react-native, which hardcodes it for token storage) to a
// expo-secure-store-backed shim — see src/lib/secure-async-storage.ts.
const SECURE_ASYNC_STORAGE_SHIM = path.resolve(__dirname, 'src/lib/secure-async-storage.ts');

config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === '@react-native-async-storage/async-storage') {
        return { type: 'sourceFile', filePath: SECURE_ASYNC_STORAGE_SHIM };
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
