import { borderWidth, colors, spacing, typography } from '@/constants/theme';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Href, useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TopBarProps =
    | { variant: 'tab'; avatarUri?: string | null; testID?: string }
    | { variant: 'stack'; onBack: () => void; testID?: string };

export function TopBar(props: TopBarProps) {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    return (
        <View
            style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}
            testID={props.testID ?? 'top-bar'}
        >
            {props.variant === 'stack' ? (
                <Pressable onPress={props.onBack} testID="top-bar-back" hitSlop={spacing.sm}>
                    <AntDesign name="arrow-left" size={24} color={colors.ink} />
                </Pressable>
            ) : (
                <View />
            )}

            <Text style={styles.wordmark}>ETHOS</Text>

            {props.variant === 'tab' ? (
                <Pressable
                    // The dashboard-page branch adds /profile — cast is required for
                    // this branch to typecheck standalone before that route exists.
                    onPress={() => router.push('/profile' as Href)}
                    testID="top-bar-avatar"
                    hitSlop={spacing.sm}
                >
                    {props.avatarUri ? (
                        <Image source={{ uri: props.avatarUri }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder} />
                    )}
                </Pressable>
            ) : (
                <View style={styles.spacer} />
            )}
        </View>
    );
}

const AVATAR_SIZE = 40;

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.yellow,
        borderBottomWidth: borderWidth.accent,
        borderBottomColor: colors.ink,
    },
    wordmark: {
        fontFamily: typography.fonts.black,
        fontSize: 22,
        fontStyle: 'italic',
        letterSpacing: 1,
        color: colors.ink,
        textTransform: 'uppercase',
    },
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderWidth: borderWidth.structural - 1,
        borderColor: colors.ink,
    },
    avatarPlaceholder: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderWidth: borderWidth.structural - 1,
        borderColor: colors.ink,
        backgroundColor: colors.surfaceRaised,
    },
    spacer: {
        // Matches the avatar's footprint exactly so the stack and tab variants
        // render at the same height — a width-only spacer collapses to 0
        // height, leaving the row's height governed only by the back icon.
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
    },
});
