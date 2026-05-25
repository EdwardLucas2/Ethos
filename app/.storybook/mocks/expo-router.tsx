// Minimal no-op mock for expo-router.
// Link renders its children as a pressable; router methods are spies.
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { fn } from 'storybook/test';

export const mockRouterReplace = fn().mockName('router.replace');
export const mockRouterPush = fn().mockName('router.push');
export const mockRouterBack = fn().mockName('router.back');

export function Link({
    children,
    testID,
    onPress,
}: {
    children: React.ReactNode;
    testID?: string;
    href?: unknown;
    onPress?: () => void;
}) {
    return (
        <TouchableOpacity testID={testID} onPress={onPress}>
            {children}
        </TouchableOpacity>
    );
}

export function useRouter() {
    return { replace: mockRouterReplace, push: mockRouterPush, back: mockRouterBack };
}

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
