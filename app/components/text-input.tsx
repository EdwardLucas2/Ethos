import { borderWidth, colors, spacing, typography } from '@/constants/theme';
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

export function EthosTextInput({
    placeholder,
    isPassword = false,
    value,
    onChangeText,
    onSubmitEditing,
    returnKeyType,
    testID, //What is this? Do we need it?
}: Props) {
    return (
        <RNTextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={colors.inkSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={isPassword ? 'default' : 'email-address'} //What other keyboard types are there? Should we pass this as an optional prop?
            secureTextEntry={isPassword}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            value={value}
            onChangeText={onChangeText}
            testID={testID}
        />
    );
}

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
