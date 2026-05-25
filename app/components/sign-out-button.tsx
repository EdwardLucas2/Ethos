import { useAuth } from '@/src/context/AuthContext';
import { borderWidth, colors, spacing, typography } from '@/constants/theme';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

export function SignOutButton() {
    const { signOut } = useAuth();
    const [loading, setLoading] = useState(false);

    async function handleSignOut() {
        setLoading(true);
        try {
            await signOut();
        } finally {
            setLoading(false);
        }
    }

    return (
        <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={handleSignOut}
            disabled={loading}
            testID="sign-out-button"
        >
            {loading ? (
                <ActivityIndicator color={colors.white} />
            ) : (
                <Text style={styles.text}>SIGN OUT</Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: colors.ink,
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        alignItems: 'center',
    },
    buttonPressed: {
        opacity: 0.7,
    },
    text: {
        color: colors.white,
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        letterSpacing: 0.5,
    },
});
