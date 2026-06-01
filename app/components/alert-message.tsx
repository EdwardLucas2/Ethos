import AntDesign from '@expo/vector-icons/AntDesign';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { borderWidth, colors, shadows, spacing, typography } from '@/constants/theme';

type DismissibleProps =
    | { dismissible: true; onDismiss: () => void }
    | { dismissible?: false; onDismiss?: () => void };

export type AlertMessageProps = {
    message: string;
    severity?: 'error' | 'warning' | 'info';
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
        textColor: colors.white,
        iconColor: colors.white,
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
        textColor: colors.white,
        iconColor: colors.white,
        iconName: 'info-circle',
    },
};

export function AlertMessage({
    message,
    severity = 'error',
    dismissible = false,
    onDismiss,
}: AlertMessageProps) {
    const config = SEVERITY_CONFIG[severity];

    const handlePress = () => {
        if (!dismissible) return;
        onDismiss?.();
    };

    return (
        <TouchableOpacity
            testID="alert-message"
            activeOpacity={dismissible ? 0.8 : 1}
            onPress={handlePress}
            style={[styles.container, { backgroundColor: config.backgroundColor }]}
        >
            <AntDesign
                testID="alert-message-icon"
                name={config.iconName}
                size={20}
                color={config.iconColor}
                style={styles.icon}
            />
            <Text testID="alert-message-text" style={[styles.text, { color: config.textColor }]}>
                {message.toUpperCase()}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        ...shadows.md,
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
