import { useAuth } from '@/src/context/AuthContext';
import { Redirect } from 'expo-router';

// Expo Router needs a real route matching "/" to resolve the app's initial
// deep link — without one it falls through to the internal not-found screen
// and app/_layout.tsx never mounts at all. This screen owns its own redirect
// (rather than relying on RootRedirect, which is scoped to enforcing the
// public/protected split for named route groups, not the bare root) so it
// can send the user on as soon as auth state resolves.
export default function Index() {
    const { session, isLoading } = useAuth();

    if (isLoading) return null;
    return <Redirect href={session ? '/dashboard' : '/login'} />;
}
