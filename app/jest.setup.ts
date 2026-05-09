// supertokens-react-native reads/writes expo-secure-store under the hood.
// Mock the whole module so tests never touch native storage.
jest.mock('supertokens-react-native', () => ({
    __esModule: true,
    default: { init: jest.fn() },
    doesSessionExist: jest.fn().mockResolvedValue(false),
    getAccessToken: jest.fn().mockResolvedValue(null),
    signOut: jest.fn().mockResolvedValue(undefined),
}));
