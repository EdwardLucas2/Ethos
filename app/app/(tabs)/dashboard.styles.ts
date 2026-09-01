import { colors, spacing, typography } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.md,
        paddingBottom: spacing.xxl * 2,
    },
    // Sections used to get uniform spacing for free from scrollContent's
    // gap. Now that alertStack needs a smaller gap below it than between
    // notifications, each section carries its own trailing spacing instead.
    section: {
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    alertStack: {
        gap: spacing.lg,
        marginBottom: spacing.md,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    sectionHeader: {
        fontFamily: typography.fonts.black,
        fontSize: 24,
        fontStyle: 'italic',
        textTransform: 'uppercase',
        letterSpacing: -0.5,
        color: colors.ink,
    },
    countBadge: {
        backgroundColor: colors.ink,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    countBadgeText: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        color: colors.surfaceRaised,
    },
    skeletonBlock: {
        width: '100%',
        height: 80,
        backgroundColor: colors.surfaceRaised,
        borderWidth: 1,
        borderColor: colors.borderMuted,
    },
    skeletonStack: {
        gap: spacing.sm,
    },
    centered: {
        paddingVertical: spacing.xxl,
        alignItems: 'center',
    },
    errorText: {
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        color: colors.inkSecondary,
        textAlign: 'center',
    },
});
