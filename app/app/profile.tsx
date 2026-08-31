import { Card } from '@/components/card';
import { SignOutButton } from '@/components/sign-out-button';
import { TopBar } from '@/components/top-bar';
import { UserResponse, useGetUsersMe } from '@/src/api';
import { unwrapData } from '@/src/api/unwrap';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { styles } from './profile.styles';

export default function ProfileScreen() {
    const router = useRouter();
    const { data: meResponse, isLoading } = useGetUsersMe();
    const me = unwrapData<UserResponse>(meResponse);

    return (
        <View style={styles.flex}>
            <TopBar variant="stack" onBack={() => router.back()} />
            {isLoading ? (
                <ActivityIndicator style={styles.content} />
            ) : (
                <View style={styles.content}>
                    <Card>
                        <View style={styles.field}>
                            <Text style={styles.label}>Display Name</Text>
                            <Text style={styles.value} testID="profile-display-name">
                                {me?.displayName}
                            </Text>
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>Tag</Text>
                            <Text style={styles.value}>@{me?.tag}</Text>
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>Email</Text>
                            <Text style={styles.value}>{me?.email}</Text>
                        </View>
                    </Card>
                    <View style={styles.logout}>
                        <SignOutButton />
                    </View>
                </View>
            )}
        </View>
    );
}
