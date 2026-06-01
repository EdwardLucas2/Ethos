import { borderWidth, colors, spacing, typography } from '@/constants/theme';
import { forwardRef } from 'react';
import {
    KeyboardTypeOptions,
    TextInput as RNTextInput,
    TextInputProps,
    StyleSheet,
} from 'react-native';

type Props = {
    placeholder: string;
    isPassword?: boolean;
    autoComplete?: TextInputProps['autoComplete'];
    value: string;
    onChangeText: (text: string) => void;
    onSubmitEditing?: () => void;
    returnKeyType?: 'next' | 'done';
    keyboardType?: KeyboardTypeOptions;
    testID?: string;
};

export const TextInput = forwardRef<RNTextInput, Props>(function TextInput(
    {
        placeholder,
        isPassword = false,
        autoComplete,
        value,
        onChangeText,
        onSubmitEditing,
        returnKeyType,
        keyboardType = 'default',
        testID,
    },
    ref
) {
    return (
        <RNTextInput
            ref={ref}
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={colors.inkSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={autoComplete}
            keyboardType={keyboardType}
            secureTextEntry={isPassword}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            value={value}
            onChangeText={onChangeText}
            testID={testID}
        />
    );
});

const styles = StyleSheet.create({
    input: {
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        color: colors.ink,
        backgroundColor: colors.surfaceRaised,
    },
});
