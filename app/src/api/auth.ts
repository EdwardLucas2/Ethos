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
    return email.split('@')[0] ?? email;
}

type AuthResponse = {
    status: string;
    formFields?: Array<{ id: string; error: string }>;
};

async function authFetch(path: string, body: unknown): Promise<AuthResponse> {
    const response = await fetch(`${AUTH_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new AuthError('Request failed', 'UNKNOWN');
    }

    return response.json() as Promise<AuthResponse>;
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

    // Token is now in SecureStore — read it to call the backend
    const token = await SuperTokens.getAccessToken();
    if (!token) {
        throw new AuthError('Session not established after signup', 'UNKNOWN');
    }

    const usersRes = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ displayName: deriveDisplayName(email) }),
    });

    if (!usersRes.ok) {
        throw new AuthError('Failed to create user profile', 'UNKNOWN');
    }
}
