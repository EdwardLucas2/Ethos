// Minimal no-op mock for expo-router.
// Link renders its children as a pressable; router methods are spies.
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { fn } from 'storybook/test';

export const mockRouterReplace = fn().mockName('router.replace');
export const mockRouterPush = fn().mockName('router.push');
export const mockRouterBack = fn().mockName('router.back');

type LinkProps = {
    children: React.ReactNode;
    testID?: string;
    href?: string;
    dismissTo?: boolean;
    style?: unknown;
    onPress?: () => void;
};

function LinkBase({ children, testID, href, onPress, style }: LinkProps) {
    return (
        <TouchableOpacity
            testID={testID}
            style={style as never}
            onPress={onPress ?? (href !== undefined ? () => mockRouterPush(href) : undefined)}
        >
            {children}
        </TouchableOpacity>
    );
}

// Real expo-router exposes these as static sub-components of Link for its
// context-menu API; stub them as pass-through wrappers so screens using the
// `<Link.Trigger>`/`<Link.Preview>`/`<Link.Menu>` pattern still render in Storybook.
export const Link = Object.assign(LinkBase, {
    Trigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Preview: () => null,
    Menu: ({ children }: { children: React.ReactNode; title?: string; icon?: string }) => (
        <>{children}</>
    ),
    MenuAction: (_props: { title: string; icon?: string; onPress?: () => void }) => null,
});

function ScreenStub() {
    return null;
}

export function Stack({ children }: { children?: React.ReactNode }) {
    return <>{children}</>;
}
Stack.Screen = ScreenStub;

export function Tabs({ children }: { children?: React.ReactNode }) {
    return <>{children}</>;
}
Tabs.Screen = ScreenStub;

export function Slot() {
    return null;
}

export function useRouter() {
    return { replace: mockRouterReplace, push: mockRouterPush, back: mockRouterBack };
}

export function useNavigation() {
    return {};
}

export function useFocusEffect(_effect: () => void) {}

export function useLocalSearchParams() {
    return {};
}

export function useSegments() {
    return [];
}

export function usePathname() {
    return '/';
}

export const Redirect = (_props: { href: string }) => null;
