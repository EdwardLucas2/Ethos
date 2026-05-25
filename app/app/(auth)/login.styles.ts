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

    // Form fields
    label: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: colors.ink,
        letterSpacing: 1,
        marginBottom: spacing.xs,
        textTransform: 'uppercase',
    },
    passwordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    forgot: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: colors.blue,
        letterSpacing: 1,
        textTransform: 'uppercase',
        textDecorationLine: 'underline',
    },

    // Alert wrapper
    alertWrapper: {
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
    },

    // Continue button
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
        textTransform: 'uppercase',
    },
    buttonIcon: {
        fontFamily: typography.fonts.bold,
        fontSize: 18,
        color: colors.white,
        marginLeft: spacing.sm,
    },

    // OTP button
    otpButtonShadow: {
        marginTop: spacing.md,
        marginBottom: spacing.xs,
        marginRight: spacing.xs,
        ...shadows.sm,
    },
    otpButton: {
        backgroundColor: colors.yellow,
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        paddingVertical: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    otpButtonText: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: colors.ink,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },

    // OR CONNECT WITH separator
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

    // OAuth row (side by side)
    oauthRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    oauthFlex: {
        flex: 1,
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
