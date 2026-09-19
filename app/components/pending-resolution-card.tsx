import { PressableCard } from '@/components/pressable-card';
import { ProgressBar } from '@/components/progress-bar';
import { borderWidth, colors, spacing, typography } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

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
        <PressableCard
            testID={testID}
            onPress={onPress}
            shadowSize={4}
            wrapperStyle={styles.wrapper}
            cardStyle={styles.card}
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
        </PressableCard>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: spacing.sm,
    },
    card: {
        backgroundColor: colors.surface,
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
