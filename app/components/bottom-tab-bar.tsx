import { borderWidth, colors, spacing, typography } from '@/constants/theme';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabName = 'home' | 'contracts' | 'friends';

type BottomTabBarProps = {
    activeTab: TabName;
    testID?: string;
};

// Casts below are required for this branch to typecheck standalone: /dashboard,
// /contracts, and /friends are added by the dashboard-page branch, so they aren't
// part of Expo Router's typed-route union until that branch's screens exist.
const TABS: {
    name: TabName;
    label: string;
    icon: React.ComponentProps<typeof AntDesign>['name'];
    href: Href;
}[] = [
    { name: 'home', label: 'HOME', icon: 'dashboard', href: '/dashboard' as Href },
    { name: 'contracts', label: 'CONTRACTS', icon: 'file-text', href: '/contracts' as Href },
    { name: 'friends', label: 'FRIENDS', icon: 'team', href: '/friends' as Href },
];

export function BottomTabBar({ activeTab, testID = 'bottom-tab-bar' }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    return (
        <View style={[styles.bar, { paddingBottom: insets.bottom }]} testID={testID}>
            {TABS.map((tab) => {
                const active = tab.name === activeTab;
                return (
                    <Pressable
                        key={tab.name}
                        style={[styles.tab, active && styles.tabActive]}
                        onPress={() => !active && router.push(tab.href)}
                        testID={`${testID}-${tab.name}`}
                    >
                        <AntDesign
                            name={tab.icon}
                            size={22}
                            color={active ? colors.ink : colors.inkSecondary}
                        />
                        <Text style={[styles.label, active && styles.labelActive]}>
                            {tab.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        width: '100%',
        backgroundColor: colors.surfaceRaised,
        borderTopWidth: borderWidth.accent,
        borderTopColor: colors.ink,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        gap: spacing.xs,
    },
    tabActive: {
        backgroundColor: colors.yellow,
    },
    label: {
        fontFamily: typography.fonts.bold,
        fontSize: 9,
        letterSpacing: 0.5,
        color: colors.inkSecondary,
    },
    labelActive: {
        color: colors.ink,
    },
});
