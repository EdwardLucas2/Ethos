import { BottomTabBar, TabName } from '@/components/bottom-tab-bar';
import { TopBar } from '@/components/top-bar';
import { colors, spacing, typography } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

export type PlaceholderScreenProps = {
    activeTab: TabName;
    avatarUri?: string | null;
    title: string;
    message: string;
};

// Full-screen "not built yet" stand-in — shared by tab screens that have the
// chrome (TopBar/BottomTabBar) wired up but no real content behind it yet.
export function PlaceholderScreen({
    activeTab,
    avatarUri,
    title,
    message,
}: PlaceholderScreenProps) {
    return (
        <View style={styles.flex}>
            <TopBar variant="tab" avatarUri={avatarUri} />
            <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.message}>{message}</Text>
            </View>
            <BottomTabBar activeTab={activeTab} />
        </View>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
        gap: spacing.sm,
    },
    title: {
        fontFamily: typography.fonts.black,
        fontSize: 22,
        fontStyle: 'italic',
        textTransform: 'uppercase',
        textAlign: 'center',
        color: colors.ink,
    },
    message: {
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        color: colors.inkSecondary,
        textAlign: 'center',
    },
});
