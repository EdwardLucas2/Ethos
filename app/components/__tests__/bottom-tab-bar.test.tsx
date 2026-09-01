import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { BottomTabBar } from '../bottom-tab-bar';
import { colors } from '@/constants/theme';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush }),
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
});
