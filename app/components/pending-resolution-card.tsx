import { ProgressBar } from '@/components/progress-bar';
import { borderWidth, colors, offsetShadow, spacing, typography } from '@/constants/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const SHADOW = offsetShadow(4);

export type PendingResolutionCardProps = {
    contractName: string;
    verified: number;
    total: number;
    reviewsNeeded: number;
    onPress: () => void;
    testID?: string;
};

export function PendingResolutionCard({
    contractName,
    verified,
    total,
    reviewsNeeded,
    onPress,
    testID = 'pending-resolution-card',
}: PendingResolutionCardProps) {
    return (
        <View style={styles.wrapper}>
            <View style={SHADOW.box} />
            <Pressable
                testID={testID}
                onPress={onPress}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>{contractName}</Text>
                    <View style={styles.reviewsBadge}>
                        <Text style={styles.reviewsNeeded}>
                            {reviewsNeeded} {reviewsNeeded === 1 ? 'REVIEW' : 'REVIEWS'} NEEDED
                        </Text>
                    </View>
                </View>
                <Text style={styles.summary}>
                    {verified}/{total} VERIFIED
                </Text>
                <ProgressBar verified={verified} pending={0} total={total} size="compact" />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        marginBottom: spacing.sm,
    },
    card: {
        backgroundColor: colors.surface,
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        padding: spacing.lg,
        opacity: 0.85,
        ...SHADOW.faceMargin,
    },
    pressed: {
        transform: [{ translateX: 2 }, { translateY: 2 }],
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    title: {
        fontFamily: typography.fonts.black,
        fontSize: 16,
        textTransform: 'uppercase',
        color: colors.ink,
    },
    reviewsBadge: {
        borderWidth: borderWidth.thin,
        borderColor: colors.ink,
        backgroundColor: colors.surfaceRaised,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    reviewsNeeded: {
        fontFamily: typography.fonts.bold,
        fontSize: 10,
        letterSpacing: 0.5,
        color: colors.inkSecondary,
    },
    summary: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        color: colors.inkSecondary,
        marginBottom: spacing.xs,
    },
});
