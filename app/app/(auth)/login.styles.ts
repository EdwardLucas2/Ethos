import { colors, spacing, typography } from '@/constants/theme';
import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { authScreenStyles } from './auth-screen.styles';

// Merged as a plain object first, then passed to StyleSheet.create — spreading
// authScreenStyles directly inside the StyleSheet.create(...) call's argument
// trips up its self-referential generic (`T extends NamedStyles<T>`), which
// silently widens/drops the spread keys. Building the merge as its own typed
// const sidesteps that: it's resolved by ordinary spread inference first, and
// StyleSheet.create then just validates an already-concrete object.
const merged = {
    ...authScreenStyles,
    passwordField: {
        marginTop: spacing.md,
    },
    otpButton: {
        marginTop: spacing.md,
    },
    oauthRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    oauthFlex: {
        flex: 1,
    },
    forgot: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: colors.blue,
        letterSpacing: 1,
        textTransform: 'uppercase',
        textDecorationLine: 'underline',
    },
} satisfies Record<string, ViewStyle | TextStyle>;

export const styles = StyleSheet.create(merged);
