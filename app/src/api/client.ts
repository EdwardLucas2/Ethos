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

async function getCachedAccessToken(): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;
  const value = (await SuperTokens.getAccessToken()) ?? null;
  cachedToken = { value, expiresAt: Date.now() + TOKEN_CACHE_TTL_MS };
  return value;
}

export function clearCachedAccessToken(): void {
  cachedToken = null;
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
    // hook authenticated automatically.
    const token = await getCachedAccessToken();
    // Started right before the network call, not before the token read above —
    // otherwise a slow secure-storage read eats into the fetch timeout budget.
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
      throw Object.assign(new Error('Request timed out'), { status: undefined });
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
