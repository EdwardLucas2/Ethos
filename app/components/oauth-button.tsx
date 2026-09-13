import { borderWidth, colors, offsetShadow, spacing, typography } from '@/constants/theme';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

const SHADOW = offsetShadow(4);

type OAuthButtonProps = {
    provider: 'google' | 'apple';
    onPress?: () => void;
    disabled?: boolean;
    testID?: string;
    style?: ViewStyle;
};

export function OAuthButton({
    provider,
    onPress,
    disabled = false,
    testID,
    style,
}: OAuthButtonProps) {
    return (
        <View style={style}>
            <View style={SHADOW.box} />
            <Pressable
                style={({ pressed }) => [
                    styles.button,
                    SHADOW.faceMargin,
                    pressed && !disabled && styles.pressed,
                ]}
                onPress={onPress}
                disabled={disabled}
                testID={testID}
            >
                <View style={styles.inner}>
                    <Text style={styles.icon}>{provider === 'google' ? 'G' : 'iOS'}</Text>
                    <Text style={styles.label}>{provider === 'google' ? 'GOOGLE' : 'APPLE'}</Text>
                </View>
                {disabled && <View style={styles.disabledOverlay} />}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: colors.surfaceRaised,
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        paddingVertical: spacing.sm + 2,
        paddingHorizontal: spacing.md,
    },
    pressed: {
        transform: [{ translateX: 2 }, { translateY: 2 }],
    },
    disabledOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(200, 200, 200, 0.5)',
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
