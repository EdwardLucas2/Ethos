import { borderWidth, colors, spacing, typography } from '@/constants/theme';
import { forwardRef } from 'react';
import { TextInput as RNTextInput, StyleSheet } from 'react-native';

type Props = {
    placeholder: string;
    isPassword?: boolean;
    value: string;
    onChangeText: (text: string) => void;
    onSubmitEditing?: () => void;
    returnKeyType?: 'next' | 'done';
    testID?: string;
};

export const EthosTextInput = forwardRef<RNTextInput, Props>(function EthosTextInput(
    {
        placeholder,
        isPassword = false,
        value,
        onChangeText,
        onSubmitEditing,
        returnKeyType,
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
            keyboardType={isPassword ? 'default' : 'email-address'}
            secureTextEntry={isPassword && !__DEV__}
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
