import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { SignOutButton } from '../sign-out-button';
import { useAuth } from '@/src/context/AuthContext';

jest.mock('@/src/context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

const mockSignOut = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAuth).mockReturnValue({
        signOut: mockSignOut,
        session: null,
        isLoading: false,
        refreshSession: jest.fn(),
    });
    mockSignOut.mockResolvedValue(undefined);
});

describe('SignOutButton', () => {
    it('renders the sign out label', () => {
        render(<SignOutButton />);
        expect(screen.getByText('SIGN OUT')).toBeTruthy();
    });

    it('calls signOut when pressed', async () => {
        render(<SignOutButton />);
        fireEvent.press(screen.getByTestId('sign-out-button'));
        await waitFor(() => {
            expect(mockSignOut).toHaveBeenCalledTimes(1);
        });
    });

    it('hides the label and shows a spinner while sign-out is in progress', async () => {
        mockSignOut.mockReturnValue(new Promise(() => {})); // never resolves
        render(<SignOutButton />);

        fireEvent.press(screen.getByTestId('sign-out-button'));

        await waitFor(() => {
            expect(screen.queryByText('SIGN OUT')).toBeNull();
        });
    });
});
