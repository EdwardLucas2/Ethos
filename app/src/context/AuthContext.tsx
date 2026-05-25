import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import SuperTokens from 'supertokens-react-native';

const AUTH_URL = process.env['EXPO_PUBLIC_AUTH_URL'] ?? 'http://localhost:3568';

SuperTokens.init({
    apiDomain: AUTH_URL,
    apiBasePath: '/auth',
    tokenTransferMethod: 'header',
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
    session: string | null;
    isLoading: boolean;
    /** Call after a successful login/signup API response to refresh session state. */
    refreshSession: () => Promise<void>;
    signOut: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        SuperTokens.doesSessionExist()
            .then(async (exists: boolean) => {
                if (exists) {
                    const token = await SuperTokens.getAccessToken();
                    setSession(token ?? null);
                } else {
                    setSession(null);
                }
            })
            .catch(() => setSession(null))
            .finally(() => setIsLoading(false));
    }, []);

    const refreshSession = useCallback(async () => {
        const exists = await SuperTokens.doesSessionExist();
        if (exists) {
            const token = await SuperTokens.getAccessToken();
            setSession(token ?? null);
        } else {
            setSession(null);
        }
    }, []);

    const signOut = useCallback(async () => {
        await SuperTokens.signOut();
        setSession(null);
    }, []);

    return (
        <AuthContext.Provider value={{ session, isLoading, refreshSession, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (ctx === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return ctx;
}
