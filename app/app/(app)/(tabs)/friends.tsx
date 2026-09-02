import { PlaceholderScreen } from '@/components/placeholder-screen';
import { useCurrentUser } from '@/hooks/use-current-user';

// Not built yet — friend search/add and the contacts list are unspecced.
export default function FriendsScreen() {
    const { data: me } = useCurrentUser();

    return (
        <PlaceholderScreen
            activeTab="friends"
            avatarUri={me?.avatarUrl}
            title="Coming Soon"
            message="Adding and managing friends will live here."
        />
    );
}
