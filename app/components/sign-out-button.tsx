import { AlertMessage } from '@/components/alert-message';
import { Button } from '@/components/button';
import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/constants/theme';
import { useState } from 'react';
import { View } from 'react-native';

export function SignOutButton() {
    const { signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSignOut() {
        setLoading(true);
        setError(null);
        try {
            await signOut();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Sign out failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <View>
            {error ? (
                <View style={{ marginBottom: spacing.sm }}>
                    <AlertMessage
                        message={error}
                        severity="error"
                        dismissible
                        onDismiss={() => setError(null)}
                    />
                </View>
            ) : null}
            <Button
                label="SIGN OUT"
                onPress={handleSignOut}
                backgroundColor={colors.ink}
                loading={loading}
                testID="sign-out-button"
            />
        </View>
    );
}
