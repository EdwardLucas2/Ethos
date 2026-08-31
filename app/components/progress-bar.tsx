import { borderWidth, colors, shadows, spacing } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';

export type ProgressBarProps = {
    verified: number;
    pending: number;
    total: number;
    size?: 'compact' | 'standard';
    testID?: string;
};

const HEIGHT = { compact: 16, standard: 24 } as const;

export function ProgressBar({
    verified,
    pending,
    total,
    size = 'compact',
    testID,
}: ProgressBarProps) {
    const safeTotal = total > 0 ? total : 1;
    const verifiedRatio = Math.min(verified / safeTotal, 1);
    const pendingRatio = Math.min(pending / safeTotal, 1 - verifiedRatio);

    return (
        <View style={[styles.track, { height: HEIGHT[size] }, shadows.sm]} testID={testID}>
            {verifiedRatio > 0 && <View style={[styles.verified, { flex: verifiedRatio }]} />}
            {pendingRatio > 0 && <View style={[styles.pending, { flex: pendingRatio }]} />}
        </View>
    );
}

const styles = StyleSheet.create({
    track: {
        flexDirection: 'row',
        width: '100%',
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        backgroundColor: colors.surface,
        marginBottom: spacing.xs,
        marginRight: spacing.xs,
    },
    verified: {
        backgroundColor: colors.yellow,
    },
    pending: {
        backgroundColor: colors.yellow,
        opacity: 0.4,
    },
});
