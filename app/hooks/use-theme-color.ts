import { colors } from '@/constants/theme';

// Ethos is light-only. This hook is kept for boilerplate component compatibility.
export function useThemeColor(
    props: { light?: string; dark?: string },
    colorName: keyof typeof colors
) {
    return props.light ?? colors[colorName];
}
