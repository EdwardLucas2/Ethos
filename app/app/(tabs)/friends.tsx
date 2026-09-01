import { PlaceholderScreen } from '@/components/placeholder-screen';
import { useGetUsersMe } from '@/src/api';
import { useAuth } from '@/src/context/AuthContext';

// Not built yet — friend search/add and the contacts list are unspecced.
export default function FriendsScreen() {
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
            activeTab="friends"
            avatarUri={authLoading || isLoading || isError ? undefined : me?.avatarUrl}
            title="Coming Soon"
            message="Adding and managing friends will live here."
        />
    );
}
