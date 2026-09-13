import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { TopBar } from '../top-bar';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('TopBar', () => {
    it('renders a back button for the stack variant and calls onBack when tapped', () => {
        const onBack = jest.fn();
        render(<TopBar variant="stack" onBack={onBack} />);
        fireEvent.press(screen.getByTestId('top-bar-back'));
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('renders an avatar slot instead of a back button for the tab variant', () => {
        render(<TopBar variant="tab" />);
        expect(screen.queryByTestId('top-bar-back')).toBeNull();
        expect(screen.getByTestId('top-bar-avatar')).toBeTruthy();
    });

    it('navigates to /profile when the avatar is tapped', () => {
        render(<TopBar variant="tab" />);
        fireEvent.press(screen.getByTestId('top-bar-avatar'));
        expect(mockPush).toHaveBeenCalledWith('/profile');
    });
});
