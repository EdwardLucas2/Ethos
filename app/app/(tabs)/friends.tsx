import { BottomTabBar } from '@/components/bottom-tab-bar';
import { TopBar } from '@/components/top-bar';
import { UserResponse, useGetUsersMe } from '@/src/api';
import { unwrapData } from '@/src/api/unwrap';
import { Text, View } from 'react-native';
import { styles } from './friends.styles';

// Not built yet — friend search/add and the contacts list are unspecced.
export default function FriendsScreen() {
    const { data: meResponse } = useGetUsersMe();
    const me = unwrapData<UserResponse>(meResponse);

    return (
        <View style={styles.flex}>
            <TopBar variant="tab" avatarUri={me?.avatarUrl} />
            <View style={styles.content}>
                <Text style={styles.placeholderTitle}>Coming Soon</Text>
                <Text style={styles.placeholderText}>
                    Adding and managing friends will live here.
                </Text>
            </View>
            <BottomTabBar activeTab="friends" />
        </View>
    );
}
