import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import SuperTokens from '@/src/lib/supertokens';

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

    // Bumped on every session read so a stale read that resolves after a
    // newer one (e.g. this mount-time check finishing after a fresh login's
    // refreshSession already set the session) can tell it's been superseded
    // and skip applying its now-outdated result.
    const readId = useRef(0);

    const loadSession = useCallback(async (): Promise<string | null> => {
        const exists = await SuperTokens.doesSessionExist();
        if (!exists) return null;
        return (await SuperTokens.getAccessToken()) ?? null;
    }, []);

    useEffect(() => {
        const thisRead = ++readId.current;
        loadSession()
            .then((token) => {
                if (readId.current === thisRead) setSession(token);
            })
            .catch(() => {
                if (readId.current === thisRead) setSession(null);
            })
            .finally(() => {
                if (readId.current === thisRead) setIsLoading(false);
            });
    }, [loadSession]);

    // Errors intentionally propagate — callers (login/sign-up) already wrap
    // this in a try/catch that surfaces the failure, so swallowing it here
    // would leave the user staring at a submitted form with no feedback.
    const refreshSession = useCallback(async () => {
        const thisRead = ++readId.current;
        const token = await loadSession();
        if (readId.current === thisRead) setSession(token);
    }, [loadSession]);

    // Only clears local session state once SuperTokens confirms sign-out
    // succeeded — clearing unconditionally (in a finally) would desync local
    // state from the real session on failure, forcing RootRedirect to bounce
    // the user to /login at the same moment SignOutButton reports the error.
    const signOut = useCallback(async () => {
        await SuperTokens.signOut();
        readId.current++; // invalidate any in-flight session read
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
