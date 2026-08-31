import { PlaceholderScreen } from '@/components/placeholder-screen';
import { UserResponse, useGetUsersMe } from '@/src/api';
import { unwrapData } from '@/src/api/unwrap';

// Not built yet — see docs/COMPONENTS.md's BottomTabBar note: Contracts needs
// its own all-contracts-list backend endpoint that doesn't exist yet.
export default function ContractsScreen() {
    const { data: meResponse } = useGetUsersMe();
    const me = unwrapData<UserResponse>(meResponse);

    return (
        <PlaceholderScreen
            activeTab="contracts"
            avatarUri={me?.avatarUrl}
            title="Coming Soon"
            message="Your full contract history will live here."
        />
    );
}
