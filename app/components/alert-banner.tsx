import { borderWidth, colors, offsetShadow, spacing, typography } from '@/constants/theme';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type AlertBannerType = 'verify' | 'challenge' | 'settle' | 'owed' | 'pay-up';

const SHADOW = offsetShadow(4);

export type AlertBannerProps = {
    type: AlertBannerType;
    message: string;
    /** e.g. "VERIFY", "SETTLE" — rendered as a bordered tag, not inline brackets. */
    actionLabel: string;
    onPress: () => void;
    testID?: string;
};

type TypeConfig = {
    backgroundColor: string;
    textColor: string;
    icon: React.ComponentProps<typeof AntDesign>['name'];
};

const TYPE_CONFIG: Record<AlertBannerType, TypeConfig> = {
    verify: { backgroundColor: colors.blue, textColor: colors.surfaceRaised, icon: 'check-circle' },
    challenge: { backgroundColor: colors.yellow, textColor: colors.ink, icon: 'mail' },
    settle: { backgroundColor: colors.red, textColor: colors.surfaceRaised, icon: 'wallet' },
    owed: { backgroundColor: colors.yellow, textColor: colors.ink, icon: 'trophy' },
    'pay-up': { backgroundColor: colors.red, textColor: colors.surfaceRaised, icon: 'credit-card' },
};

export function AlertBanner({
    type,
    message,
    actionLabel,
    onPress,
    testID = 'alert-banner',
}: AlertBannerProps) {
    const config = TYPE_CONFIG[type];

    return (
        <View style={styles.wrapper}>
            <View style={SHADOW.box} />
            <Pressable
                testID={testID}
                onPress={onPress}
                style={({ pressed }) => [
                    styles.container,
                    { backgroundColor: config.backgroundColor },
                    pressed && styles.pressed,
                ]}
            >
                <View style={styles.left}>
                    <AntDesign name={config.icon} size={20} color={config.textColor} />
                    <Text style={[styles.message, { color: config.textColor }]}>
                        {message.toUpperCase()}
                    </Text>
                </View>
                <View style={styles.right}>
                    <View style={[styles.actionBadge, { borderColor: config.textColor }]}>
                        <Text style={[styles.actionText, { color: config.textColor }]}>
                            {actionLabel.toUpperCase()}
                        </Text>
                    </View>
                    <AntDesign name="right" size={18} color={config.textColor} />
                </View>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
    },
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        ...SHADOW.faceMargin,
    },
    pressed: {
        transform: [{ translateX: 2 }, { translateY: 2 }],
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
        gap: spacing.sm,
    },
    message: {
        flexShrink: 1,
        fontFamily: typography.fonts.black,
        fontSize: 13,
        letterSpacing: 0.5,
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginLeft: spacing.sm,
    },
    actionBadge: {
        borderWidth: borderWidth.structural - 1,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    actionText: {
        fontFamily: typography.fonts.black,
        fontSize: 11,
        letterSpacing: 0.5,
    },
});
