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
