import { borderWidth, colors, shadows, spacing, typography } from '@/constants/theme';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

type Props = {
    provider: 'google' | 'apple';
    onPress?: () => void;
    testID?: string;
    style?: ViewStyle;
};

export function OAuthButton({ provider, onPress, testID, style }: Props) {
    return (
        <View style={[styles.shadow, style]}>
            <Pressable style={styles.button} onPress={onPress} testID={testID}>
                <View style={styles.inner}>
                    <Text style={styles.icon}>{provider === 'google' ? 'G' : 'iOS'}</Text>
                    <Text style={styles.label}>{provider === 'google' ? 'GOOGLE' : 'APPLE'}</Text>
                </View>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    shadow: {
        marginRight: spacing.xs,
        marginBottom: spacing.xs,
        ...shadows.sm,
    },
    button: {
        backgroundColor: colors.surfaceRaised,
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        paddingVertical: spacing.sm + 2,
        paddingHorizontal: spacing.md,
    },
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        fontFamily: typography.fonts.bold,
        fontSize: 13,
        color: colors.ink,
        marginRight: spacing.sm,
    },
    label: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: colors.ink,
        letterSpacing: 2,
    },
});
