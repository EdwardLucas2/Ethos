import SuperTokens from 'supertokens-react-native';

const AUTH_URL = process.env['EXPO_PUBLIC_AUTH_URL'] ?? 'http://localhost:3568';
const API_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:8080';

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
    formFields?: Array<{ id: string; error: string }>;
};

async function authFetch(path: string, body: unknown): Promise<AuthResponse> {
    let response: Response;
    try {
        response = await fetch(`${AUTH_URL}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    } catch {
        throw new AuthError('Connection failed. Please check your network and try again.', 'UNKNOWN');
    }

    if (!response.ok) {
        throw new AuthError('Request failed', 'UNKNOWN');
    }

    return response.json() as Promise<AuthResponse>;
}

// Idempotent: POSTs to /users; treats 409 (row already exists) as success.
// Called after both signup and signin so a signup that crashed between the
// SuperTokens write and the /users write is recovered on the user's next login.
async function ensureUserProfile(email: string): Promise<void> {
    const token = await SuperTokens.getAccessToken();
    if (!token) {
        throw new AuthError('Session not established', 'UNKNOWN');
    }

    let res: Response;
    try {
        res = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ displayName: deriveDisplayName(email) }),
        });
    } catch {
        throw new AuthError('Connection failed. Please check your network and try again.', 'UNKNOWN');
    }

    if (res.ok || res.status === 409) return;
    throw new AuthError('Failed to create user profile', 'UNKNOWN');
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
