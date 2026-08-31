import { PlaceholderScreen } from '@/components/placeholder-screen';
import { UserResponse, useGetUsersMe } from '@/src/api';
import { unwrapData } from '@/src/api/unwrap';

// Not built yet — friend search/add and the contacts list are unspecced.
export default function FriendsScreen() {
    const { data: meResponse } = useGetUsersMe();
    const me = unwrapData<UserResponse>(meResponse);

    return (
        <PlaceholderScreen
            activeTab="friends"
            avatarUri={me?.avatarUrl}
            title="Coming Soon"
            message="Adding and managing friends will live here."
        />
    );
}
