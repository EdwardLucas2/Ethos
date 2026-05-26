import { Platform } from 'react-native';

// ─── Colours ────────────────────────────────────────────────────────────────

export const colors = {
    surface: '#F4F4F0',
    surfaceRaised: '#FFFFFF',
    ink: '#000000',
    inkSecondary: '#3F3F3F',
    blue: '#3B82F6',
    yellow: '#FDDC00',
    red: '#FF3E3E',
    white: '#FFFFFF',
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────
// Hard offset shadows (no blur, full black) per the Ethos design system.
// React Native doesn't support box-shadow directly; we approximate with
// shadowOffset + elevation. The visual shift is achieved by giving the
// element a margin/offset equal to the shadow size in consuming components.

const shadow = (size: 4 | 6 | 8) =>
    Platform.select({
        web: {
            // react-native-web: use CSS box-shadow for hard offset effect
            boxShadow: `${size}px ${size}px 0px #000000`,
        } as object,
        ios: {
            shadowColor: '#000000',
            shadowOffset: { width: size, height: size },
            shadowOpacity: 1,
            shadowRadius: 0,
        },
        default: {
            elevation: size,
            shadowColor: '#000000',
        },
    }) ?? { elevation: size, shadowColor: '#000000' };

export const shadows = {
    sm: shadow(4),
    md: shadow(6),
    lg: shadow(8),
} as const;

// ─── Spacing (8px base grid) ──────────────────────────────────────────────────

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
} as const;

// ─── Borders ─────────────────────────────────────────────────────────────────

export const borderWidth = {
    structural: 3,
    accent: 4,
} as const;

export const borderRadius = {
    none: 0,
    full: 9999,
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────
// Font family names as registered by @expo-google-fonts/public-sans.
// Use these directly as the `fontFamily` value in StyleSheet.

export const typography = {
    fonts: {
        regular: 'PublicSans_400Regular',
        medium: 'PublicSans_500Medium',
        bold: 'PublicSans_700Bold',
        extraBold: 'PublicSans_800ExtraBold',
        black: 'PublicSans_900Black',
    },
} as const;

// ─── Text styles ─────────────────────────────────────────────────────────────
// Spread into StyleSheet.create() entries: { ...textStyles.hero, color: colors.ink }
// All-caps roles use textTransform: 'uppercase' — never write uppercase strings in JSX.
// letterSpacing is intentionally omitted; see product/DESIGN.md for guidance.

export const textStyles = {
    // Page stamps — Black italic. "WELCOME BACK.", "PAY UP", "BUILD THE LOBBY"
    hero: {
        fontFamily: typography.fonts.black,
        fontSize: 40,
        fontStyle: 'italic' as const,
        textTransform: 'uppercase' as const,
    },
    // Section identity headers — italic. "ACTIVE ARENA", "YOUR COMMITMENT"
    title: {
        fontFamily: typography.fonts.extraBold,
        fontSize: 24,
        fontStyle: 'italic' as const,
        textTransform: 'uppercase' as const,
    },
    // Structural card headers — upright. "GROUND RULES", "SQUAD STATUS"
    section: {
        fontFamily: typography.fonts.bold,
        fontSize: 13,
        textTransform: 'uppercase' as const,
    },
    // Card titles and page headings — upright. "GYM 3X/WEEK", "CREATE ACCOUNT"
    heading: {
        fontFamily: typography.fonts.extraBold,
        fontSize: 20,
        textTransform: 'uppercase' as const,
    },
    // Running copy — sentence case. "Enter your credentials to access the vault."
    body: {
        fontFamily: typography.fonts.regular,
        fontSize: 15,
    },
    // Field and control labels. "EMAIL ADDRESS", "CONTRACT NAME"
    label: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        textTransform: 'uppercase' as const,
    },
    // Supporting metadata. "VS ALEX", "CYCLE #42 · RESOLVED"
    meta: {
        fontFamily: typography.fonts.regular,
        fontSize: 10,
        textTransform: 'uppercase' as const,
    },
    // Button labels. "CONTINUE", "SIGN CONTRACT", "I KNOW"
    cta: {
        fontFamily: typography.fonts.extraBold,
        fontSize: 16,
        textTransform: 'uppercase' as const,
    },
    // Badges, tab labels, dividers. "HUB", "SIGNED", "OR CONNECT WITH"
    micro: {
        fontFamily: typography.fonts.bold,
        fontSize: 9,
        textTransform: 'uppercase' as const,
    },
};
