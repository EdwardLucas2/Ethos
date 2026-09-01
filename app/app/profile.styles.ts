import { colors, spacing, typography } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    content: {
        padding: spacing.lg,
        gap: spacing.lg,
    },
    field: {
        gap: spacing.xs,
    },
    label: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: colors.inkSecondary,
    },
    value: {
        fontFamily: typography.fonts.black,
        fontSize: 18,
        color: colors.ink,
    },
    logout: {
        marginTop: spacing.lg,
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
