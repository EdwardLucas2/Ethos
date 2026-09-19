import { borderWidth, colors, offsetShadow, spacing, typography } from '@/constants/theme';
import AntDesign from '@expo/vector-icons/AntDesign';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';

type ButtonProps = {
    label: string;
    onPress?: () => void;
    backgroundColor?: string;
    loading?: boolean;
    disabled?: boolean;
    showArrow?: boolean;
    /** Leading icon, e.g. for ActiveContractCard's "SNAP PROOF" CTA. */
    icon?: React.ComponentProps<typeof AntDesign>['name'];
    withShadow?: boolean;
    testID?: string;
    style?: ViewStyle;
    /** Override the label's typography, e.g. ActiveContractCard's italic font-black CTA. */
    labelStyle?: TextStyle;
};

// Light-background colours render ink text; everything else gets white.
const LIGHT_BACKGROUNDS = new Set<string>([colors.yellow, colors.surface, colors.surfaceRaised]);

const SHADOW = offsetShadow(4);

export function Button({
    label,
    onPress,
    backgroundColor = colors.blue,
    loading = false,
    disabled = false,
    showArrow = false,
    icon,
    withShadow = true,
    testID,
    style,
    labelStyle,
}: ButtonProps) {
    const textColor = LIGHT_BACKGROUNDS.has(backgroundColor) ? colors.ink : colors.surfaceRaised;
    const isDisabled = disabled || loading;

    return (
        <View style={style}>
            {withShadow && <View style={SHADOW.box} />}
            <Pressable
                style={({ pressed }) => [
                    styles.button,
                    { backgroundColor },
                    withShadow && SHADOW.faceMargin,
                    pressed && !isDisabled && styles.pressed,
                ]}
                onPress={onPress}
                disabled={isDisabled}
                testID={testID}
            >
                {loading ? (
                    <ActivityIndicator color={textColor} />
                ) : (
                    <View style={styles.inner}>
                        {icon ? (
                            <AntDesign
                                name={icon}
                                size={18}
                                color={textColor}
                                style={styles.icon}
                            />
                        ) : null}
                        <Text style={[styles.label, { color: textColor }, labelStyle]}>
                            {label}
                        </Text>
                        {showArrow ? (
                            <Text style={[styles.arrow, { color: textColor }]}>→</Text>
                        ) : null}
                    </View>
                )}
                {disabled && !loading && <View style={styles.disabledOverlay} />}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pressed: {
        opacity: 0.9,
        transform: [{ translateX: 2 }, { translateY: 2 }],
    },
    disabledOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(200, 200, 200, 0.5)',
    },
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: spacing.sm,
    },
    label: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    arrow: {
        fontFamily: typography.fonts.bold,
        fontSize: 18,
        marginLeft: spacing.sm,
    },
});
