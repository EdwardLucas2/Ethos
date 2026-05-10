// supertokens-react-native uses native storage which doesn't exist in Node.js.
// Mock the default export with the shape our code actually calls.
jest.mock('supertokens-react-native', () => ({
    __esModule: true,
    default: {
        init: jest.fn(),
        doesSessionExist: jest.fn().mockResolvedValue(false),
        getAccessToken: jest.fn().mockResolvedValue(null),
        signOut: jest.fn().mockResolvedValue(undefined),
    },
}));
