import { borderWidth, colors, shadows, spacing, typography } from '@/constants/theme';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

type Props = {
    label: string;
    onPress?: () => void;
    backgroundColor?: string;
    loading?: boolean;
    disabled?: boolean;
    showArrow?: boolean;
    withShadow?: boolean;
    testID?: string;
    style?: ViewStyle;
};

// Light-background colours render ink text; everything else gets white.
const LIGHT_BACKGROUNDS = new Set<string>([colors.yellow, colors.surface, colors.surfaceRaised]);

export function Button({
    label,
    onPress,
    backgroundColor = colors.blue,
    loading = false,
    disabled = false,
    showArrow = false,
    withShadow = true,
    testID,
    style,
}: Props) {
    const textColor = LIGHT_BACKGROUNDS.has(backgroundColor) ? colors.ink : colors.white;
    const isDisabled = disabled || loading;

    return (
        <View style={[withShadow ? styles.shadow : styles.noShadow, style]}>
            <Pressable
                style={({ pressed }) => [
                    styles.button,
                    { backgroundColor },
                    pressed && !isDisabled && styles.pressed,
                ]}
                onPress={onPress}
                disabled={isDisabled}
                testID={testID}
            >
                {loading ? (
                    <ActivityIndicator color={textColor} />
                ) : (
                    <View style={styles.inner}>
                        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
                        {showArrow ? (
                            <Text style={[styles.arrow, { color: textColor }]}>→</Text>
                        ) : null}
                    </View>
                )}
                {disabled && !loading && <View style={styles.disabledOverlay} />}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    shadow: {
        marginBottom: spacing.xs,
        marginRight: spacing.xs,
        ...shadows.sm,
    },
    noShadow: {},
    button: {
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        paddingVertical: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pressed: {
        opacity: 0.9,
        transform: [{ translateX: 2 }, { translateY: 2 }],
    },
    disabledOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(200, 200, 200, 0.5)',
    },
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    arrow: {
        fontFamily: typography.fonts.bold,
        fontSize: 18,
        marginLeft: spacing.sm,
    },
});
