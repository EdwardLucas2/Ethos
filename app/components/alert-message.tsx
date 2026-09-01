import AntDesign from '@expo/vector-icons/AntDesign';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { borderWidth, colors, offsetShadow, spacing, typography } from '@/constants/theme';

const SHADOW = offsetShadow(6);

type DismissibleProps =
    | { dismissible: true; onDismiss: () => void }
    | { dismissible?: false; onDismiss?: () => void };

export type AlertMessageProps = {
    message: string;
    severity?: 'error' | 'warning' | 'info';
    testID?: string;
} & DismissibleProps;

type SeverityConfig = {
    backgroundColor: string;
    textColor: string;
    iconColor: string;
    iconName: React.ComponentProps<typeof AntDesign>['name'];
};

const SEVERITY_CONFIG: Record<NonNullable<AlertMessageProps['severity']>, SeverityConfig> = {
    error: {
        backgroundColor: colors.red,
        textColor: colors.surfaceRaised,
        iconColor: colors.surfaceRaised,
        iconName: 'warning',
    },
    warning: {
        backgroundColor: colors.yellow,
        textColor: colors.ink,
        iconColor: colors.ink,
        iconName: 'warning',
    },
    info: {
        backgroundColor: colors.blue,
        textColor: colors.surfaceRaised,
        iconColor: colors.surfaceRaised,
        iconName: 'info-circle',
    },
};

export function AlertMessage({
    message,
    severity = 'error',
    dismissible = false,
    onDismiss,
    testID = 'alert-message',
}: AlertMessageProps) {
    const config = SEVERITY_CONFIG[severity];

    const handlePress = () => {
        if (!dismissible) return;
        onDismiss?.();
    };

    return (
        <View style={styles.wrapper}>
            <View style={SHADOW.box} />
            <TouchableOpacity
                testID={testID}
                activeOpacity={dismissible ? 0.8 : 1}
                onPress={handlePress}
                style={[styles.container, { backgroundColor: config.backgroundColor }]}
            >
                <AntDesign
                    testID={`${testID}-icon`}
                    name={config.iconName}
                    size={20}
                    color={config.iconColor}
                    style={styles.icon}
                />
                <Text testID={`${testID}-text`} style={[styles.text, { color: config.textColor }]}>
                    {message.toUpperCase()}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        ...SHADOW.faceMargin,
    },
    icon: {
        marginRight: spacing.sm,
        flexShrink: 0,
    },
    text: {
        flex: 1,
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: 0.5,
    },
});
