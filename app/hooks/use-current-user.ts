import { useGetUsersMe } from '@/src/api';
import { useAuth } from '@/src/context/AuthContext';

// Folds auth-session loading into the query's own isLoading — the query is
// `enabled` only once a session exists, so its own isLoading is false while
// auth is still resolving; callers that gate a spinner on isLoading need
// that phase included too, not just the query's.
export function useCurrentUser() {
    const { session, isLoading: authLoading } = useAuth();
    const query = useGetUsersMe({ query: { enabled: !authLoading && !!session } });
    return { ...query, isLoading: authLoading || query.isLoading };
}
