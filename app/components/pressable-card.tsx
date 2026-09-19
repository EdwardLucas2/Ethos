import { borderWidth, colors, offsetShadow, spacing } from '@/constants/theme';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

export type PressableCardProps = {
    testID?: string;
    onPress: () => void;
    shadowSize: 4 | 6 | 8;
    wrapperStyle?: ViewStyle;
    cardStyle?: ViewStyle;
    children: ReactNode;
};

// Shared shell for the offset-shadow "tappable card" pattern used by
// ActiveContractCard and PendingResolutionCard — the shadow box, the
// pressed-state translate, and the card's own border/padding are identical
// across both; only the card's background/opacity, shadow size, and any
// extra wrapper spacing differ.
export function PressableCard({
    testID,
    onPress,
    shadowSize,
    wrapperStyle,
    cardStyle,
    children,
}: PressableCardProps) {
    const shadow = offsetShadow(shadowSize);
    return (
        <View style={[styles.wrapper, wrapperStyle]}>
            <View style={shadow.box} />
            <Pressable
                testID={testID}
                onPress={onPress}
                style={({ pressed }) => [
                    styles.card,
                    shadow.faceMargin,
                    cardStyle,
                    pressed && styles.pressed,
                ]}
            >
                {children}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
    },
    card: {
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        padding: spacing.lg,
    },
    pressed: {
        transform: [{ translateX: 2 }, { translateY: 2 }],
    },
});
