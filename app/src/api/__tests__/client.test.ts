/**
 * Unit tests for customFetch's timeout budget (src/api/client.ts).
 * supertokens-react-native is globally mocked (jest.setup.ts); fetch is
 * mocked per test. Fake timers drive the clock so elapsed time is exact.
 */
import { customFetch, clearCachedAccessToken, getCachedAccessToken } from '../client';
import SuperTokens from 'supertokens-react-native';

const REQUEST_TIMEOUT_MS = 10_000;

beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    clearCachedAccessToken();
});

afterEach(() => {
    jest.useRealTimers();
});

it('bounds total request latency by REQUEST_TIMEOUT_MS even when the token read is slow', async () => {
    // Resolves well under REQUEST_TIMEOUT_MS on its own, but late enough that
    // giving the subsequent fetch a fresh full timeout budget (the pre-fix
    // behavior) would let the total exceed REQUEST_TIMEOUT_MS.
    (SuperTokens.getAccessToken as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('token'), 9_000))
    );

    let fetchAborted = false;
    global.fetch = jest.fn((_url: RequestInfo | URL, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
                fetchAborted = true;
                reject(new DOMException('Aborted', 'AbortError'));
            });
        });
    }) as unknown as typeof fetch;

    const result = customFetch('/some-endpoint');
    const assertion = expect(result).rejects.toMatchObject({ message: 'Request timed out' });

    await jest.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);

    expect(fetchAborted).toBe(true);
    await assertion;
});

it('does not cache a null token result, so a subsequent call re-checks instead of reusing it', async () => {
    (SuperTokens.getAccessToken as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('fresh-token');

    const first = await getCachedAccessToken();
    const second = await getCachedAccessToken();

    expect(first).toBeNull();
    expect(second).toBe('fresh-token');
    expect(SuperTokens.getAccessToken).toHaveBeenCalledTimes(2);
});
