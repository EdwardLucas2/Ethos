import { borderWidth, colors, spacing, typography } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    content: {
        padding: spacing.lg,
        gap: spacing.sm,
    },
    row: {
        backgroundColor: colors.surfaceRaised,
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    rowTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    name: {
        fontFamily: typography.fonts.black,
        fontSize: 16,
        textTransform: 'uppercase',
        color: colors.ink,
    },
    status: {
        fontFamily: typography.fonts.bold,
        fontSize: 10,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        color: colors.inkSecondary,
    },
    opponents: {
        fontFamily: typography.fonts.regular,
        fontSize: 12,
        color: colors.inkSecondary,
        marginTop: spacing.xs,
    },
    emptyText: {
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        color: colors.inkSecondary,
        textAlign: 'center',
    },
});
