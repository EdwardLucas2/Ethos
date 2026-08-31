import { colors, spacing, typography } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
        gap: spacing.sm,
    },
    placeholderTitle: {
        fontFamily: typography.fonts.black,
        fontSize: 22,
        fontStyle: 'italic',
        textTransform: 'uppercase',
        textAlign: 'center',
        color: colors.ink,
    },
    placeholderText: {
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        color: colors.inkSecondary,
        textAlign: 'center',
    },
});
