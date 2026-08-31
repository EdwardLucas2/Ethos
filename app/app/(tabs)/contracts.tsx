import { BottomTabBar } from '@/components/bottom-tab-bar';
import { TopBar } from '@/components/top-bar';
import { UserResponse, useGetUsersMe } from '@/src/api';
import { unwrapData } from '@/src/api/unwrap';
import { Text, View } from 'react-native';
import { styles } from './contracts.styles';

// Not built yet — see docs/COMPONENTS.md's BottomTabBar note: Contracts needs
// its own all-contracts-list backend endpoint that doesn't exist yet.
export default function ContractsScreen() {
    const { data: meResponse } = useGetUsersMe();
    const me = unwrapData<UserResponse>(meResponse);

    return (
        <View style={styles.flex}>
            <TopBar variant="tab" avatarUri={me?.avatarUrl} />
            <View style={styles.content}>
                <Text style={styles.placeholderTitle}>Coming Soon</Text>
                <Text style={styles.placeholderText}>
                    Your full contract history will live here.
                </Text>
            </View>
            <BottomTabBar activeTab="contracts" />
        </View>
    );
}
