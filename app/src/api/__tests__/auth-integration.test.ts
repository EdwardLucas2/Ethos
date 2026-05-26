/**
 * Unit tests for the auth API module (signIn, signUp).
 * Both fetch and supertokens-react-native are mocked — no network or token
 * storage is exercised. The full auth handshake is covered by Maestro E2E.
 */
import { signIn, signUp } from '../auth';
import SuperTokens from 'supertokens-react-native';

// Returns a fetch implementation that responds to the auth endpoint and the backend
// /users endpoint independently. Either side can be set to ok/conflict/error.
function mockFetchFor(opts: {
    authStatus: string;
    authFormFields?: Array<{ id: string; error: string }>;
    usersStatus: number;
}) {
    return jest.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL) => {
        if (url.toString().includes('/auth/')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    status: opts.authStatus,
                    formFields: opts.authFormFields,
                }),
            } as unknown as Response;
        }
        return {
            ok: opts.usersStatus >= 200 && opts.usersStatus < 300,
            status: opts.usersStatus,
        } as unknown as Response;
    });
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    // Both signIn and signUp call ensureUserProfile, which needs a valid token.
    (SuperTokens.getAccessToken as jest.Mock).mockResolvedValue('fake-token');
});

describe('signIn', () => {
    it('posts to the correct URL with email and password', async () => {
        const fetchSpy = mockFetchFor({ authStatus: 'OK', usersStatus: 409 });

        await signIn('test@example.com', 'password123');

        const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
        expect(url.toString()).toMatch(/\/auth\/signin$/);
        expect(JSON.parse(init.body as string)).toEqual({
            formFields: [
                { id: 'email', value: 'test@example.com' },
                { id: 'password', value: 'password123' },
            ],
        });
    });

    it('throws AuthError WRONG_CREDENTIALS on bad credentials', async () => {
        mockFetchFor({ authStatus: 'WRONG_CREDENTIALS_ERROR', usersStatus: 409 });

        await expect(signIn('x@x.com', 'wrong')).rejects.toMatchObject({
            code: 'WRONG_CREDENTIALS',
        });
    });

    it('throws AuthError UNKNOWN on network failure', async () => {
        jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network request failed'));

        await expect(signIn('x@x.com', 'password123')).rejects.toMatchObject({
            code: 'UNKNOWN',
            message: expect.stringContaining('Connection failed'),
        });
    });

    it('recovers from a missing users row by POSTing /users after signin', async () => {
        const fetchSpy = mockFetchFor({ authStatus: 'OK', usersStatus: 201 });

        await signIn('orphan@example.com', 'password123');

        const urls = fetchSpy.mock.calls.map((c) => c[0]!.toString());
        expect(urls.some((u) => u.includes('/users'))).toBe(true);
    });
});

describe('signUp', () => {
    it('calls the auth server then the backend /users endpoint', async () => {
        const fetchSpy = mockFetchFor({ authStatus: 'OK', usersStatus: 201 });

        await signUp('new@example.com', 'password123');

        const urls = fetchSpy.mock.calls.map((c) => c[0]!.toString());
        expect(urls.some((u) => /\/auth\/signup$/.test(u))).toBe(true);
        expect(urls.some((u) => u.includes('/users'))).toBe(true);
    });

    it('throws AuthError EMAIL_EXISTS on duplicate email', async () => {
        mockFetchFor({
            authStatus: 'FIELD_ERROR',
            authFormFields: [
                { id: 'email', error: 'This email already exists. Please sign in instead.' },
            ],
            usersStatus: 201,
        });

        await expect(signUp('taken@example.com', 'password123')).rejects.toMatchObject({
            code: 'EMAIL_EXISTS',
        });
    });

    it('treats a 409 from /users as success (signup already partially completed)', async () => {
        mockFetchFor({ authStatus: 'OK', usersStatus: 409 });

        await expect(signUp('new@example.com', 'password123')).resolves.toBeUndefined();
    });
});
