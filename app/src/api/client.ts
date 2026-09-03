import SuperTokens from '@/src/lib/supertokens';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';
const REQUEST_TIMEOUT_MS = 10_000;

// Short-TTL cache so a screen's burst of parallel queries shares one secure-storage read.
const TOKEN_CACHE_TTL_MS = 5_000;
let cachedToken: { value: string | null; expiresAt: number } | null = null;
// Memoizes the in-flight read too, so concurrent callers share one SuperTokens call.
let pendingToken: Promise<string | null> | null = null;

export async function getCachedAccessToken(): Promise<string | null> {
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
    // Token read and network fetch share one deadline so a slow secure-storage
    // read eats into, rather than adds to, the request's total time budget.
    const deadline = Date.now() + REQUEST_TIMEOUT_MS;
    const token = await withTimeout(getCachedAccessToken(), REQUEST_TIMEOUT_MS);
    timer = setTimeout(() => controller.abort(), Math.max(0, deadline - Date.now()));
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
    // Status is attached so callers can branch on specific codes (e.g. treating 409 as expected).
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw Object.assign(error, { status: response.status });
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  return data as T;
}
