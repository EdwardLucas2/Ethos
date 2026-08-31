import { ProgressBar } from '@/components/progress-bar';
import { borderWidth, colors, shadows, spacing, typography } from '@/constants/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
        <Pressable testID={testID} onPress={onPress} style={[styles.card, shadows.sm]}>
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
    );
}

const styles = StyleSheet.create({
    card: {
        width: '100%',
        backgroundColor: colors.surface,
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        padding: spacing.lg,
        marginBottom: spacing.sm,
        marginRight: spacing.xs,
        opacity: 0.85,
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
        borderWidth: borderWidth.structural - 1,
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
