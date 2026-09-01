import { PlaceholderScreen } from '@/components/placeholder-screen';
import { useGetUsersMe } from '@/src/api';
import { useAuth } from '@/src/context/AuthContext';

// Not built yet — see docs/COMPONENTS.md's BottomTabBar note: Contracts needs
// its own all-contracts-list backend endpoint that doesn't exist yet.
export default function ContractsScreen() {
    const { session, isLoading: authLoading } = useAuth();
    const {
        data: me,
        isLoading,
        isError,
    } = useGetUsersMe({
        query: { enabled: !authLoading && !!session },
    });

    return (
        <PlaceholderScreen
            activeTab="contracts"
            avatarUri={authLoading || isLoading || isError ? undefined : me?.avatarUrl}
            title="Coming Soon"
            message="Your full contract history will live here."
        />
    );
}
