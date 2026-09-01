import { borderWidth, colors, spacing, typography } from '@/constants/theme';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Href, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
    { name: 'home', label: 'HOME', icon: 'home', href: '/dashboard' as Href },
    { name: 'contracts', label: 'CONTRACTS', icon: 'file-text', href: '/contracts' as Href },
    { name: 'friends', label: 'FRIENDS', icon: 'team', href: '/friends' as Href },
];

export function BottomTabBar({ activeTab, testID = 'bottom-tab-bar' }: BottomTabBarProps) {
    const router = useRouter();

    return (
        <View style={styles.bar} testID={testID}>
            {TABS.map((tab, index) => {
                const active = tab.name === activeTab;
                return (
                    <Pressable
                        key={tab.name}
                        style={[
                            styles.tab,
                            index > 0 && styles.tabDivider,
                            active && styles.tabActive,
                        ]}
                        onPressIn={() => {
                            if (process.env.EXPO_OS === 'ios') {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                        }}
                        onPress={() => !active && router.push(tab.href)}
                        testID={`${testID}-${tab.name}`}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={tab.label}
                    >
                        {({ pressed }) => (
                            <>
                                <AntDesign
                                    name={tab.icon}
                                    size={22}
                                    color={active ? colors.ink : colors.inkSecondary}
                                    style={pressed && styles.iconPressed}
                                />
                                <Text style={[styles.label, active && styles.labelActive]}>
                                    {tab.label}
                                </Text>
                            </>
                        )}
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
        borderTopWidth: borderWidth.accent,
        borderTopColor: colors.ink,
    },
    tab: {
        // Fixed padding, not the safe-area inset — BottomTabBar is always the
        // last flex child in a full-height column, so it reaches the screen's
        // bottom edge regardless of its own height. Padding here only needs to
        // clear the home indicator visually, not pad out to the device inset.
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingVertical: spacing.sm,
        gap: spacing.xs,
        backgroundColor: colors.surfaceRaised,
    },
    tabDivider: {
        borderLeftWidth: borderWidth.accent,
        borderLeftColor: colors.ink,
    },
    tabActive: {
        backgroundColor: colors.yellow,
    },
    // Fakes a heavier icon stroke on press — AntDesign's glyphs don't have a
    // separate bold variant, so a tight same-colour text shadow thickens the
    // silhouette without changing layout or size.
    iconPressed: {
        textShadowColor: colors.ink,
        textShadowOffset: { width: 0.6, height: 0.6 },
        textShadowRadius: 0.3,
    },
    label: {
        fontFamily: typography.fonts.black,
        fontSize: 10,
        letterSpacing: 0.5,
        color: colors.inkSecondary,
    },
    labelActive: {
        color: colors.ink,
    },
});
