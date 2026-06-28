import { TextInput } from '@/components/text-input';
import { colors, spacing, typography } from '@/constants/theme';
import { forwardRef } from 'react';
import {
    KeyboardTypeOptions,
    StyleSheet,
    Text,
    TextInput as RNTextInput,
    TextInputProps,
    View,
    ViewStyle,
} from 'react-native';

type Props = {
    label: string;
    placeholder: string;
    rightElement?: React.ReactNode;
    containerStyle?: ViewStyle;
    isPassword?: boolean;
    autoComplete?: TextInputProps['autoComplete'];
    value: string;
    onChangeText: (text: string) => void;
    onSubmitEditing?: () => void;
    returnKeyType?: 'next' | 'done';
    keyboardType?: KeyboardTypeOptions;
    testID?: string;
};

export const FormField = forwardRef<RNTextInput, Props>(function FormField(
    { label, placeholder, rightElement, containerStyle, ...inputProps },
    ref
) {
    return (
        <View style={containerStyle}>
            {rightElement ? (
                <View style={styles.labelRow}>
                    <Text style={styles.labelText}>{label}</Text>
                    {rightElement}
                </View>
            ) : (
                <Text style={[styles.labelText, styles.labelMargin]}>{label}</Text>
            )}
            <TextInput ref={ref} placeholder={placeholder} {...inputProps} />
        </View>
    );
});

const styles = StyleSheet.create({
    labelText: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: colors.ink,
        letterSpacing: 1,
    },
    labelMargin: {
        marginBottom: spacing.xs,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
});
