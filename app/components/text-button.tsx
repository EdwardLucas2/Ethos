import { colors, spacing, typography } from '@/constants/theme';
import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
    label: string;
    onPress?: () => void;
    disabled?: boolean;
    testID?: string;
};

export function TextButton({ label, onPress, disabled = false, testID }: Props) {
    return (
        <Pressable onPress={onPress} disabled={disabled} testID={testID}>
            <Text style={[styles.label, disabled && styles.disabled]}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    label: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        color: colors.blue,
        letterSpacing: spacing.xs,
    },
    disabled: {
        opacity: 0.4,
    },
});
