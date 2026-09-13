import { colors, spacing } from '@/constants/theme';
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
        <View style={styles.wrapper}>
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
    },
    pressed: {
        backgroundColor: colors.redPressed,
    },
});
