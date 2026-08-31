import { borderWidth, colors, shadows, spacing } from '@/constants/theme';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Pressable, StyleSheet } from 'react-native';

export type FabProps = {
    onPress: () => void;
    loading?: boolean;
    testID?: string;
};

const SIZE = 64;

export function FAB({ onPress, loading = false, testID = 'fab' }: FabProps) {
    return (
        <Pressable
            testID={testID}
            onPress={onPress}
            disabled={loading}
            style={({ pressed }) => [styles.fab, shadows.md, pressed && styles.pressed]}
        >
            <AntDesign name="plus" size={28} color={colors.surfaceRaised} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        right: spacing.lg,
        bottom: spacing.xl,
        width: SIZE,
        height: SIZE,
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
