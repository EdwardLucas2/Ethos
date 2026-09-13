import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { BottomTabBar } from '../bottom-tab-bar';
import { colors } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush }),
}));

jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    ImpactFeedbackStyle: { Light: 'light' },
}));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('BottomTabBar', () => {
    it('renders the active tab label in ink and inactive tabs in inkSecondary', () => {
        render(<BottomTabBar activeTab="contracts" />);
        expect(screen.getByText('CONTRACTS')).toHaveStyle({ color: colors.ink });
        expect(screen.getByText('HOME')).toHaveStyle({ color: colors.inkSecondary });
    });

    it('does not navigate when tapping the already-active tab', () => {
        render(<BottomTabBar activeTab="home" />);
        fireEvent.press(screen.getByTestId('bottom-tab-bar-home'));
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('navigates to the tab href when tapping an inactive tab', () => {
        render(<BottomTabBar activeTab="home" />);
        fireEvent.press(screen.getByTestId('bottom-tab-bar-contracts'));
        expect(mockPush).toHaveBeenCalledWith('/contracts');

        fireEvent.press(screen.getByTestId('bottom-tab-bar-friends'));
        expect(mockPush).toHaveBeenCalledWith('/friends');
    });

    it('does not fire haptic feedback when pressing the already-active tab', () => {
        const originalOS = process.env.EXPO_OS;
        process.env.EXPO_OS = 'ios';
        render(<BottomTabBar activeTab="home" />);
        fireEvent(screen.getByTestId('bottom-tab-bar-home'), 'pressIn');
        expect(Haptics.impactAsync).not.toHaveBeenCalled();
        process.env.EXPO_OS = originalOS;
    });

    it('fires haptic feedback when pressing an inactive tab', () => {
        const originalOS = process.env.EXPO_OS;
        process.env.EXPO_OS = 'ios';
        render(<BottomTabBar activeTab="home" />);
        fireEvent(screen.getByTestId('bottom-tab-bar-contracts'), 'pressIn');
        expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
        process.env.EXPO_OS = originalOS;
    });

    it('exposes tab role and selected state for screen readers', () => {
        render(<BottomTabBar activeTab="contracts" />);
        const active = screen.getByTestId('bottom-tab-bar-contracts');
        const inactive = screen.getByTestId('bottom-tab-bar-home');
        expect(active.props.accessibilityRole).toBe('tab');
        expect(active.props.accessibilityState).toEqual({ selected: true });
        expect(inactive.props.accessibilityState).toEqual({ selected: false });
    });
});
