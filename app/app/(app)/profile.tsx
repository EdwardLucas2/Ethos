import { AlertMessage } from '@/components/alert-message';
import { Card } from '@/components/card';
import { SignOutButton } from '@/components/sign-out-button';
import { TopBar } from '@/components/top-bar';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { styles } from './profile.styles';

export default function ProfileScreen() {
    const router = useRouter();
    const { data: me, isLoading, isError } = useCurrentUser();

    return (
        <View style={styles.flex}>
            <TopBar variant="stack" onBack={() => router.back()} />
            {isLoading ? (
                <ActivityIndicator style={styles.content} />
            ) : isError ? (
                <AlertMessage message="Couldn't load your profile. Try again later." />
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
