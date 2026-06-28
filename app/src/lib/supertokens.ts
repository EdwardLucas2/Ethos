import SuperTokens from 'supertokens-react-native';

const AUTH_URL = process.env['EXPO_PUBLIC_AUTH_URL'] ?? 'http://localhost:3568';

// Patches global.fetch once (guarded internally by the SDK) so that responses
// from AUTH_URL are intercepted and st-access-token / st-refresh-token headers
// are persisted to secure storage. Both auth.ts and AuthContext.tsx depend on
// this interceptor being in place before any auth fetch is made.
SuperTokens.init({
    apiDomain: AUTH_URL,
    apiBasePath: '/auth',
    tokenTransferMethod: 'header',
});

export default SuperTokens;
