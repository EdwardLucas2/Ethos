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

export const shadows = {
    sm: Platform.select({
        ios: {
            shadowColor: '#000000',
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 0,
        },
        default: {
            elevation: 4,
            shadowColor: '#000000',
        },
    })!,
    md: Platform.select({
        ios: {
            shadowColor: '#000000',
            shadowOffset: { width: 6, height: 6 },
            shadowOpacity: 1,
            shadowRadius: 0,
        },
        default: {
            elevation: 6,
            shadowColor: '#000000',
        },
    })!,
    lg: Platform.select({
        ios: {
            shadowColor: '#000000',
            shadowOffset: { width: 8, height: 8 },
            shadowOpacity: 1,
            shadowRadius: 0,
        },
        default: {
            elevation: 8,
            shadowColor: '#000000',
        },
    })!,
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

export const typography = {
    fontFamily: 'PublicSans',
    fontWeights: {
        regular: '400',
        medium: '500',
        bold: '700',
        extraBold: '800',
        black: '900',
    },
} as const;
