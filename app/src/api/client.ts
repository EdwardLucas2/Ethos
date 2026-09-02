import SuperTokens from '@/src/lib/supertokens';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';
const REQUEST_TIMEOUT_MS = 10_000;

// Short-TTL cache around SuperTokens.getAccessToken() — well under JWT
// lifetime, but long enough to collapse a screen's burst of parallel queries
// (each independently calling customFetch) into a single secure-storage read
// instead of one per request. Cleared on sign-out/session refresh so a
// session change never serves a stale token — see clearCachedAccessToken.
const TOKEN_CACHE_TTL_MS = 5_000;
let cachedToken: { value: string | null; expiresAt: number } | null = null;
// Memoizes the in-flight read itself, not just its resolved value — without
// this, a burst of simultaneous callers (the TTL cache's actual target case)
// would all see no cached value yet and each kick off their own
// SuperTokens.getAccessToken() call instead of sharing one.
let pendingToken: Promise<string | null> | null = null;

async function getCachedAccessToken(): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;
  if (pendingToken) return pendingToken;
  pendingToken = (async () => {
    try {
      const value = (await SuperTokens.getAccessToken()) ?? null;
      cachedToken = { value, expiresAt: Date.now() + TOKEN_CACHE_TTL_MS };
      return value;
    } finally {
      pendingToken = null;
    }
  })();
  return pendingToken;
}

export function clearCachedAccessToken(): void {
  cachedToken = null;
}

function timeoutError(): Error {
  return Object.assign(new Error('Request timed out'), { status: undefined });
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(timeoutError()), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function customFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();

  let response: Response;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    // Every backend endpoint except POST /users requires a bearer token; reading it
    // here (rather than injecting it at the call site) keeps every Orval-generated
    // hook authenticated automatically. Bounded by its own timeout — a stalled
    // secure-storage/refresh read shouldn't hang the request indefinitely.
    const token = await withTimeout(getCachedAccessToken(), REQUEST_TIMEOUT_MS);
    timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw timeoutError();
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    // Status is attached (not just the parsed body) so callers can branch on
    // specific codes — e.g. treating a 409 as an expected/idempotent outcome
    // — without re-implementing their own fetch wrapper just to see it.
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw Object.assign(error, { status: response.status });
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  return data as T;
}
