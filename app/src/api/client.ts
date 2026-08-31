import SuperTokens from '@/src/lib/supertokens';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';
const REQUEST_TIMEOUT_MS = 10_000;

export async function customFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // Every backend endpoint except POST /users requires a bearer token; reading it
  // here (rather than injecting it at the call site) keeps every Orval-generated
  // hook authenticated automatically.
  const token = await SuperTokens.getAccessToken();

  let response: Response;
  try {
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

  // Orval's generated types for a custom fetch mutator assume this shape
  // (data/status/headers), matching their documented custom-fetch example —
  // callers read the body via `.data`, not the resolved value directly.
  return { data, status: response.status, headers: response.headers } as T;
}
