import { customFetch } from '@/src/api/client';
import SuperTokens from '@/src/lib/supertokens';

const AUTH_URL = process.env['EXPO_PUBLIC_AUTH_URL'] ?? 'http://localhost:3568';

// ─── Types ────────────────────────────────────────────────────────────────────

export class AuthError extends Error {
    constructor(
        message: string,
        public readonly code: 'WRONG_CREDENTIALS' | 'EMAIL_EXISTS' | 'UNKNOWN'
    ) {
        super(message);
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveDisplayName(email: string): string {
    // String.split always returns at least one element
    return email.split('@')[0]!;
}

type AuthResponse = {
    status: string;
    formFields?: { id: string; error: string }[];
};

const REQUEST_TIMEOUT_MS = 10_000;

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        return await fetch(input, { ...init, signal: controller.signal });
    } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
            throw new AuthError('Request timed out. Please try again.', 'UNKNOWN');
        }
        throw e;
    } finally {
        clearTimeout(timer);
    }
}

async function authFetch(path: string, body: unknown): Promise<AuthResponse> {
    let response: Response;
    try {
        response = await fetchWithTimeout(`${AUTH_URL}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    } catch (e) {
        if (e instanceof AuthError) throw e;
        throw new AuthError(
            'Connection failed. Please check your network and try again.',
            'UNKNOWN'
        );
    }

    if (!response.ok) {
        throw new AuthError('Request failed', 'UNKNOWN');
    }

    return response.json() as Promise<AuthResponse>;
}

// Emails already confirmed to have a backend user row this app session — lets
// signIn skip the redundant POST /users call on repeat logins instead of
// paying for it every time (see ensureUserProfile below).
const profileConfirmed = new Set<string>();

// Test-only: clears the session cache so tests reusing an email don't leak
// state across cases. Not used by app code.
export function __resetProfileConfirmedCache(): void {
    profileConfirmed.clear();
}

// Idempotent: POSTs to /users; treats 409 (row already exists) as success.
// Called after signup, and after the first signin per session, so a signup
// that crashed between the SuperTokens write and the /users write is
// recovered without paying this extra round trip on every subsequent login.
async function ensureUserProfile(email: string): Promise<void> {
    if (profileConfirmed.has(email)) return;

    const token = await SuperTokens.getAccessToken();
    if (!token) throw new AuthError('Session not established', 'UNKNOWN');

    try {
        // Routed through the shared Orval mutator (src/api/client.ts) rather
        // than a second hand-rolled fetch client — /users is this backend's
        // own OpenAPI-documented endpoint, not the external SuperTokens
        // service that authFetch above legitimately talks to directly.
        // customFetch already attaches the bearer token itself.
        await customFetch('/users', {
            method: 'POST',
            body: JSON.stringify({ displayName: deriveDisplayName(email) }),
        });
    } catch (e) {
        if (isApiErrorWithStatus(e, 409)) {
            profileConfirmed.add(email);
            return;
        }
        throw new AuthError('Failed to create user profile', 'UNKNOWN');
    }

    profileConfirmed.add(email);
}

function isApiErrorWithStatus(e: unknown, status: number): boolean {
    return typeof e === 'object' && e !== null && 'status' in e && e.status === status;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string): Promise<void> {
    const data = await authFetch('/auth/signin', {
        formFields: [
            { id: 'email', value: email },
            { id: 'password', value: password },
        ],
    });

    if (data.status === 'WRONG_CREDENTIALS_ERROR') {
        throw new AuthError('Invalid email or password', 'WRONG_CREDENTIALS');
    }
    if (data.status !== 'OK') {
        throw new AuthError('Sign in failed', 'UNKNOWN');
    }
    // SuperTokens SDK has stored st-access-token from the response headers
    await ensureUserProfile(email);
}

export async function signUp(email: string, password: string): Promise<void> {
    const data = await authFetch('/auth/signup', {
        formFields: [
            { id: 'email', value: email },
            { id: 'password', value: password },
        ],
    });

    if (data.status === 'FIELD_ERROR') {
        const emailError = data.formFields?.find((f) => f.id === 'email')?.error;
        if (emailError?.toLowerCase().includes('already exists')) {
            throw new AuthError('An account with this email already exists', 'EMAIL_EXISTS');
        }
        const firstError = data.formFields?.[0]?.error ?? 'Sign up failed. Please try again.';
        throw new AuthError(firstError, 'UNKNOWN');
    }
    if (data.status !== 'OK') {
        throw new AuthError('Sign up failed. Please try again.', 'UNKNOWN');
    }

    await ensureUserProfile(email);
}
