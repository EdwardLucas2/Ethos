import { borderWidth, colors, spacing, typography } from '@/constants/theme';
import type { TextStyle, ViewStyle } from 'react-native';

// Styles shared between the (auth) screens (login, sign-up). Each screen's own
// <name>.styles.ts merges this with its screen-specific styles before a
// single StyleSheet.create call — see login.styles.ts for why it's built
// this way rather than spread directly into StyleSheet.create.
//
// `satisfies` (not a direct type annotation) validates each value against
// ViewStyle | TextStyle while still preserving literal types (e.g.
// flexDirection: 'row' staying 'row', not widening to string) — a plain
// annotation here would both erase specific keys on spread AND widen string
// literals, breaking every `styles.<key>` usage in the consuming screens.
export const authScreenStyles = {
    flex: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: 0,
    },
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
    divider: {
        height: borderWidth.structural,
        backgroundColor: colors.ink,
        marginVertical: spacing.md,
    },
    alertWrapper: {
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
    },
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
    submitButton: {
        marginTop: spacing.lg,
    },
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
} satisfies Record<string, ViewStyle | TextStyle>;
