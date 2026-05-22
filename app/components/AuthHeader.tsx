import { EthosLogo } from '@/components/ethos-logo';
import { borderWidth, colors, spacing, typography } from '@/constants/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AuthHeaderProps = {
    rightAction: {
        label: string;
        onPress: () => void;
        testID?: string;
    };
};

export function AuthHeader({ rightAction }: AuthHeaderProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}>
            <View style={styles.brand}>
                <EthosLogo size={36} />
                <Text style={styles.brandText}>ETHOS</Text>
            </View>
            <Pressable
                style={styles.actionButton}
                onPress={rightAction.onPress}
                testID={rightAction.testID}
            >
                <Text style={styles.actionButtonText}>{rightAction.label}</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: borderWidth.structural,
        borderBottomColor: colors.ink,
    },
    brand: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    brandText: {
        fontFamily: typography.fonts.black,
        fontSize: 22,
        color: colors.ink,
        letterSpacing: 2,
    },
    actionButton: {
        backgroundColor: colors.ink,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 2,
    },
    actionButtonText: {
        fontFamily: typography.fonts.bold,
        fontSize: 13,
        color: colors.white,
        letterSpacing: 1,
    },
});
