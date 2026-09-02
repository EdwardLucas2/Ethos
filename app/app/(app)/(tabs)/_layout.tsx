import { Tabs } from 'expo-router';

// The visual tab bar is our own BottomTabBar component, rendered by each
// screen — the native tab bar is kept only for its tab-switching behaviour
// (single instance per tab, no back-stack growth), not for its UI.
export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: { display: 'none' },
            }}
        >
            <Tabs.Screen name="dashboard" />
            <Tabs.Screen name="contracts" />
            <Tabs.Screen name="friends" />
        </Tabs>
    );
}
