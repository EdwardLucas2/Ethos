// Mock replacement for @/src/context/AuthContext.
// Avoids the real module importing supertokens-react-native (no web support).
import React, { createContext, useContext } from 'react';
import { fn } from 'storybook/test';

interface AuthContextValue {
    session: string | null;
    isLoading: boolean;
    refreshSession: () => Promise<void>;
    signOut: () => Promise<void>;
}

export const mockRefreshSession = fn().mockName('refreshSession').mockResolvedValue(undefined);
export const mockSignOut = fn().mockName('signOut').mockResolvedValue(undefined);

const MockAuthContext = createContext<AuthContextValue>({
    session: null,
    isLoading: false,
    refreshSession: mockRefreshSession,
    signOut: mockSignOut,
});

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
    return (
        <MockAuthContext.Provider
            value={{
                session: null,
                isLoading: false,
                refreshSession: mockRefreshSession,
                signOut: mockSignOut,
            }}
        >
            {children}
        </MockAuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    return useContext(MockAuthContext);
}
