import { borderWidth, colors, spacing, typography } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    content: {
        padding: spacing.lg,
        gap: spacing.md,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.sm,
        borderBottomWidth: borderWidth.structural - 1,
        borderBottomColor: colors.ink,
    },
    avatar: {
        width: 32,
        height: 32,
        borderWidth: borderWidth.structural - 1,
        borderColor: colors.ink,
        backgroundColor: colors.surfaceRaised,
    },
    name: {
        fontFamily: typography.fonts.black,
        fontSize: 14,
        textTransform: 'uppercase',
        color: colors.ink,
    },
    tag: {
        fontFamily: typography.fonts.regular,
        fontSize: 12,
        color: colors.inkSecondary,
    },
    emptyText: {
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        color: colors.inkSecondary,
        textAlign: 'center',
    },
});
