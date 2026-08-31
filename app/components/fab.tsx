import { borderWidth, colors, shadows, spacing } from '@/constants/theme';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Pressable, StyleSheet, View } from 'react-native';

export type FabProps = {
    onPress: () => void;
    loading?: boolean;
    testID?: string;
};

const SIZE = 64;

export function FAB({ onPress, loading = false, testID = 'fab' }: FabProps) {
    return (
        // The shadow lives on this fixed-position wrapper, not on the Pressable
        // face below — so pressing translates only the face, leaving the shadow
        // static (per DESIGN.md: press shifts 2px, shadow shrinks to match).
        <View style={[styles.wrapper, shadows.md]}>
            <Pressable
                testID={testID}
                onPress={onPress}
                disabled={loading}
                style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
            >
                <AntDesign name="plus" size={28} color={colors.surfaceRaised} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        right: spacing.lg,
        bottom: spacing.xl,
        width: SIZE,
        height: SIZE,
    },
    fab: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.red,
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
    },
    pressed: {
        opacity: 0.9,
        transform: [{ translateX: 2 }, { translateY: 2 }],
    },
});
