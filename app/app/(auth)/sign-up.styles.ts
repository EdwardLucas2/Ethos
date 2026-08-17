import { spacing } from '@/constants/theme';
import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { authScreenStyles } from './auth-screen.styles';

// Merged as a plain object first, then passed to StyleSheet.create — see
// login.styles.ts for why (a spread directly inside the StyleSheet.create(...)
// call trips up its self-referential generic).
const merged = {
    ...authScreenStyles,
    passwordField: {
        marginTop: spacing.md,
    },
    oauthGap: {
        marginTop: spacing.sm,
    },
} satisfies Record<string, ViewStyle | TextStyle>;

export const styles = StyleSheet.create(merged);
