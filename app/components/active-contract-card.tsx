import { Button } from '@/components/button';
import { ProgressBar } from '@/components/progress-bar';
import { borderWidth, colors, shadows, spacing, typography } from '@/constants/theme';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type CtaState = 'snap' | 'snap-urgent' | 'review' | 'caught-up';

export type ActiveContractCardProps = {
    contractName: string;
    opponentLabel: string;
    verified: number;
    pending: number;
    total: number;
    timeRemaining: string;
    ctaState: CtaState;
    ctaLabel: string;
    onPress: () => void;
    onCta: () => void;
    testID?: string;
};

const CTA_BACKGROUND: Record<CtaState, string> = {
    snap: colors.blue,
    'snap-urgent': colors.red,
    review: colors.ink,
    'caught-up': colors.inkSecondary,
};

export function ActiveContractCard({
    contractName,
    opponentLabel,
    verified,
    pending,
    total,
    timeRemaining,
    ctaState,
    ctaLabel,
    onPress,
    onCta,
    testID = 'active-contract-card',
}: ActiveContractCardProps) {
    const urgent = ctaState === 'snap-urgent';
    const caughtUp = ctaState === 'caught-up';

    return (
        <Pressable testID={testID} onPress={onPress} style={[styles.card, shadows.lg]}>
            <View style={styles.header}>
                <View style={styles.titleBlock}>
                    <Text style={styles.title}>{contractName}</Text>
                    <Text style={styles.subtitle}>{opponentLabel}</Text>
                </View>
                <View style={[styles.timeBadge, urgent && styles.timeBadgeUrgent]}>
                    {urgent && <AntDesign name="warning" size={12} color={colors.red} />}
                    <Text style={[styles.timeText, urgent && styles.timeTextUrgent]}>
                        {timeRemaining}
                    </Text>
                </View>
            </View>

            <View style={styles.progressBlock}>
                <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={styles.progressLabel}>
                        {verified}/{total} Verified
                    </Text>
                </View>
                <ProgressBar verified={verified} pending={pending} total={total} size="compact" />
            </View>

            <Button
                testID={`${testID}-cta`}
                label={ctaLabel}
                onPress={onCta}
                disabled={caughtUp}
                backgroundColor={CTA_BACKGROUND[ctaState]}
                icon={ctaState === 'snap' || ctaState === 'snap-urgent' ? 'camera' : undefined}
                labelStyle={styles.ctaLabel}
            />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        width: '100%',
        backgroundColor: colors.surfaceRaised,
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        padding: spacing.lg,
        marginBottom: spacing.sm,
        marginRight: spacing.xs,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    titleBlock: {
        flexShrink: 1,
    },
    title: {
        fontFamily: typography.fonts.black,
        fontSize: 20,
        textTransform: 'uppercase',
        color: colors.ink,
    },
    subtitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 13,
        textTransform: 'uppercase',
        color: colors.inkSecondary,
        marginTop: spacing.xs,
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        borderWidth: borderWidth.structural - 1,
        borderColor: colors.ink,
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    timeBadgeUrgent: {
        backgroundColor: '#FFE5E5',
    },
    timeText: {
        fontFamily: typography.fonts.black,
        fontSize: 11,
        textTransform: 'uppercase',
        color: colors.ink,
    },
    timeTextUrgent: {
        color: colors.red,
    },
    progressBlock: {
        marginBottom: spacing.lg,
    },
    progressLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    progressLabel: {
        fontFamily: typography.fonts.black,
        fontSize: 10,
        textTransform: 'uppercase',
        color: colors.ink,
    },
    ctaLabel: {
        fontFamily: typography.fonts.extraBold,
        fontStyle: 'italic',
        letterSpacing: 1,
    },
});
