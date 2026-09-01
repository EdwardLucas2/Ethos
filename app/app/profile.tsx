import { Card } from '@/components/card';
import { SignOutButton } from '@/components/sign-out-button';
import { TopBar } from '@/components/top-bar';
import { useGetUsersMe } from '@/src/api';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { styles } from './profile.styles';

export default function ProfileScreen() {
    const router = useRouter();
    const { session, isLoading: authLoading } = useAuth();
    const {
        data: me,
        isLoading,
        isError,
    } = useGetUsersMe({
        query: { enabled: !authLoading && !!session },
    });

    return (
        <View style={styles.flex}>
            <TopBar variant="stack" onBack={() => router.back()} />
            {authLoading || isLoading ? (
                <ActivityIndicator style={styles.content} />
            ) : isError ? (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>
                        Couldn&apos;t load your profile. Try again later.
                    </Text>
                </View>
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
