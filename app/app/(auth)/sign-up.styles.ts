import { borderWidth, colors, shadows, spacing, typography } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: colors.surface,
    },

    // Content
    container: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: 0,
    },

    // Card
    cardShadow: {
        width: '100%',
        marginBottom: spacing.xs,
        marginRight: spacing.xs,
        ...shadows.sm,
    },
    card: {
        width: '100%',
        backgroundColor: colors.surfaceRaised,
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        padding: spacing.lg,
    },

    // Heading
    heading: {
        fontFamily: typography.fonts.black,
        fontSize: 32,
        color: colors.ink,
        marginBottom: spacing.xs,
    },
    subheading: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        color: colors.inkSecondary,
        letterSpacing: 1,
        marginBottom: spacing.md,
    },

    // Divider
    divider: {
        height: borderWidth.structural,
        backgroundColor: colors.ink,
        marginVertical: spacing.md,
    },

    // OR USE EMAIL separator
    separator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.md,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.inkSecondary,
        opacity: 0.4,
    },
    separatorText: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        color: colors.inkSecondary,
        letterSpacing: 1,
        marginHorizontal: spacing.sm,
    },

    // Form fields
    label: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: colors.ink,
        letterSpacing: 1,
        marginBottom: spacing.xs,
    },
    labelSpaced: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: colors.ink,
        letterSpacing: 1,
        marginBottom: spacing.xs,
        marginTop: spacing.md,
    },

    // Alert wrapper
    alertWrapper: {
        marginTop: spacing.sm,
    },

    // Button
    buttonShadow: {
        marginTop: spacing.lg,
        marginBottom: spacing.xs,
        marginRight: spacing.xs,
        ...shadows.sm,
    },
    button: {
        backgroundColor: colors.blue,
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        paddingVertical: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonPressed: {
        opacity: 0.9,
        transform: [{ translateX: 2 }, { translateY: 2 }],
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonText: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: colors.white,
        letterSpacing: 2,
    },
    buttonIcon: {
        fontFamily: typography.fonts.bold,
        fontSize: 18,
        color: colors.white,
        marginLeft: spacing.sm,
    },

    // OAuth gap
    oauthGap: {
        marginTop: spacing.sm,
    },

    // Footer (inside card)
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    footerText: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        color: colors.ink,
        letterSpacing: 1,
    },
    footerLink: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        color: colors.blue,
        letterSpacing: 1,
    },
});
