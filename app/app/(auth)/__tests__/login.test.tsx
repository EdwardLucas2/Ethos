import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import LoginScreen from '../login';
import { AuthError, signIn } from '@/src/api/auth';

// ─── Setup ────────────────────────────────────────────────────────────────────

import { useAuth } from '@/src/context/AuthContext';

// ─── Module mocks ─────────────────────────────────────────────────────────────

// Keep AuthError real so we can throw it; mock only the API functions.
jest.mock('@/src/api/auth', () => ({
    ...jest.requireActual('@/src/api/auth'),
    signIn: jest.fn(),
}));

const mockRefreshSession = jest.fn();
jest.mock('@/src/context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

jest.mock('expo-router', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        Link: ({
            children,
            testID,
        }: {
            children: React.ReactNode;
            testID?: string;
            href?: unknown;
        }) => React.createElement(View, { testID }, children),
        useRouter: () => ({ replace: jest.fn() }),
    };
});

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAuth).mockReturnValue({
        refreshSession: mockRefreshSession,
        session: null,
        isLoading: false,
        signOut: jest.fn(),
    });
    (jest.mocked(signIn) as jest.Mock).mockResolvedValue(undefined);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LoginScreen', () => {
    it('renders email input, password input and submit button', () => {
        render(<LoginScreen />);
        expect(screen.getByTestId('email-input')).toBeTruthy();
        expect(screen.getByTestId('password-input')).toBeTruthy();
        expect(screen.getByTestId('submit-button')).toBeTruthy();
    });

    it('shows the sign-up navigation link', () => {
        render(<LoginScreen />);
        expect(screen.getByTestId('signup-link')).toBeTruthy();
    });

    it('shows a validation error when fields are empty', async () => {
        render(<LoginScreen />);

        fireEvent.press(screen.getByTestId('submit-button'));

        await waitFor(() => {
            expect(screen.getByText('PLEASE ENTER YOUR EMAIL AND PASSWORD.')).toBeTruthy();
        });
        expect(signIn).not.toHaveBeenCalled();
    });

    it('shows a validation error when only email is filled', async () => {
        render(<LoginScreen />);

        fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
        fireEvent.press(screen.getByTestId('submit-button'));

        await waitFor(() => {
            expect(screen.getByText('PLEASE ENTER YOUR EMAIL AND PASSWORD.')).toBeTruthy();
        });
        expect(signIn).not.toHaveBeenCalled();
    });

    it('shows the API error message for wrong credentials', async () => {
        jest.mocked(signIn).mockRejectedValue(
            new AuthError('Invalid email or password', 'WRONG_CREDENTIALS')
        );

        render(<LoginScreen />);
        fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
        fireEvent.changeText(screen.getByTestId('password-input'), 'wrongpassword');
        fireEvent.press(screen.getByTestId('submit-button'));

        await waitFor(() => {
            expect(screen.getByText('INVALID EMAIL OR PASSWORD')).toBeTruthy();
        });
        expect(mockRefreshSession).not.toHaveBeenCalled();
    });

    it('calls signIn with trimmed email and password on success', async () => {
        render(<LoginScreen />);
        fireEvent.changeText(screen.getByTestId('email-input'), '  test@example.com  ');
        fireEvent.changeText(screen.getByTestId('password-input'), 'password123');
        fireEvent.press(screen.getByTestId('submit-button'));

        await waitFor(() => {
            expect(signIn).toHaveBeenCalledWith('test@example.com', 'password123');
        });
    });

    it('calls refreshSession after a successful login', async () => {
        render(<LoginScreen />);
        fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
        fireEvent.changeText(screen.getByTestId('password-input'), 'password123');
        fireEvent.press(screen.getByTestId('submit-button'));

        await waitFor(() => {
            expect(mockRefreshSession).toHaveBeenCalledTimes(1);
        });
    });
});
