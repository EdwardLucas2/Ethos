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
            style={[styles.header, { paddingTop: insets.top }]}
            testID={props.testID ?? 'top-bar'}
        >
            {props.variant === 'stack' ? (
                <Pressable
                    style={styles.iconSlot}
                    onPress={props.onBack}
                    testID="top-bar-back"
                    hitSlop={spacing.sm}
                >
                    <AntDesign name="arrow-left" size={24} color={colors.ink} />
                </Pressable>
            ) : (
                <View style={styles.iconSlot} />
            )}

            <Text style={styles.wordmark}>ETHOS</Text>

            {props.variant === 'tab' ? (
                <Pressable
                    // The dashboard-page branch adds /profile — cast is required for
                    // this branch to typecheck standalone before that route exists.
                    style={styles.iconSlot}
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
                <View style={styles.iconSlot} />
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
        paddingBottom: spacing.sm,
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
    iconSlot: {
        // Fixed size on both sides (back arrow, avatar, and the empty
        // placeholder) so the content row's height is constant across
        // variants, independent of which icon is actually rendered.
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
