/**
 * Tests our auth API functions (signIn, signUp) in isolation:
 *   - correct fetch URL and request body
 *   - correct AuthError codes on server error responses
 *
 * supertokens-react-native is mocked globally (jest.setup.ts) — its token
 * storage is not exercised here. The full auth handshake is covered by Maestro.
 */
import { signIn, signUp } from '../auth';
import SuperTokens from 'supertokens-react-native';

beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
});

describe('signIn', () => {
    it('posts to the correct URL with email and password', async () => {
        const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ status: 'OK' }),
        } as unknown as Response);

        await signIn('test@example.com', 'password123');

        const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
        expect(url).toBe('http://localhost:3568/auth/signin');
        expect(JSON.parse(init.body as string)).toEqual({
            formFields: [
                { id: 'email', value: 'test@example.com' },
                { id: 'password', value: 'password123' },
            ],
        });
    });

    it('throws AuthError WRONG_CREDENTIALS on bad credentials', async () => {
        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ status: 'WRONG_CREDENTIALS_ERROR' }),
        } as unknown as Response);

        await expect(signIn('x@x.com', 'wrong')).rejects.toMatchObject({
            code: 'WRONG_CREDENTIALS',
        });
    });
});

describe('signUp', () => {
    beforeEach(() => {
        // signUp reads the access token after the auth call to hit the backend /users endpoint
        (SuperTokens.getAccessToken as jest.Mock).mockResolvedValue('fake-token');
    });

    it('calls the auth server then the backend /users endpoint', async () => {
        const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(
            async (url: RequestInfo | URL) => {
                if (url.toString().includes('/auth/signup')) {
                    return {
                        ok: true,
                        status: 200,
                        json: async () => ({ status: 'OK' }),
                    } as unknown as Response;
                }
                return { ok: true, status: 201 } as unknown as Response;
            }
        );

        await signUp('new@example.com', 'password123');

        const urls = fetchSpy.mock.calls.map((c) => c[0]!.toString());
        expect(urls).toContain('http://localhost:3568/auth/signup');
        expect(urls.some((u) => u.includes('/users'))).toBe(true);
    });

    it('throws AuthError EMAIL_EXISTS on duplicate email', async () => {
        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ status: 'EMAIL_ALREADY_EXISTS_ERROR' }),
        } as unknown as Response);

        await expect(signUp('taken@example.com', 'password123')).rejects.toMatchObject({
            code: 'EMAIL_EXISTS',
        });
    });
});
