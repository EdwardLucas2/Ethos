import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import SignUpScreen from '../sign-up';
import { AuthError, signUp } from '@/src/api/auth';

// ─── Setup ────────────────────────────────────────────────────────────────────

import { useAuth } from '@/src/context/AuthContext';

// ─── Module mocks ─────────────────────────────────────────────────────────────

// Keep AuthError real; mock only the API function.
jest.mock('@/src/api/auth', () => ({
    ...jest.requireActual('@/src/api/auth'),
    signUp: jest.fn(),
}));

const mockRefreshSession = jest.fn();
const mockReplace = jest.fn();
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
        useRouter: () => ({ replace: mockReplace }),
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
    (jest.mocked(signUp) as jest.Mock).mockResolvedValue(undefined);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SignUpScreen', () => {
    it('renders email input, password input and submit button', () => {
        render(<SignUpScreen />);
        expect(screen.getByTestId('email-input')).toBeTruthy();
        expect(screen.getByTestId('password-input')).toBeTruthy();
        expect(screen.getByTestId('submit-button')).toBeTruthy();
    });

    it('renders the login navigation link', () => {
        render(<SignUpScreen />);
        expect(screen.getByTestId('login-link')).toBeTruthy();
    });

    it('renders the header LOGIN button', () => {
        render(<SignUpScreen />);
        expect(screen.getByTestId('header-login-button')).toBeTruthy();
    });

    it('shows a validation error when fields are empty', async () => {
        render(<SignUpScreen />);

        fireEvent.press(screen.getByTestId('submit-button'));

        await waitFor(() => {
            expect(screen.getByText('PLEASE ENTER YOUR EMAIL AND PASSWORD.')).toBeTruthy();
        });
        expect(signUp).not.toHaveBeenCalled();
    });

    it('shows a validation error for an invalid email format', async () => {
        render(<SignUpScreen />);

        fireEvent.changeText(screen.getByTestId('email-input'), 'notanemail');
        fireEvent.changeText(screen.getByTestId('password-input'), 'password123');
        fireEvent.press(screen.getByTestId('submit-button'));

        await waitFor(() => {
            expect(screen.getByText('PLEASE ENTER A VALID EMAIL ADDRESS.')).toBeTruthy();
        });
        expect(signUp).not.toHaveBeenCalled();
    });

    it('shows a validation error when password is too short', async () => {
        render(<SignUpScreen />);

        fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
        fireEvent.changeText(screen.getByTestId('password-input'), 'short1');
        fireEvent.press(screen.getByTestId('submit-button'));

        await waitFor(() => {
            expect(
                screen.getByText('PASSWORD MUST BE AT LEAST 8 CHARACTERS AND INCLUDE A NUMBER.')
            ).toBeTruthy();
        });
        expect(signUp).not.toHaveBeenCalled();
    });

    it('shows a validation error when password has no digit', async () => {
        render(<SignUpScreen />);

        fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
        fireEvent.changeText(screen.getByTestId('password-input'), 'longpassword');
        fireEvent.press(screen.getByTestId('submit-button'));

        await waitFor(() => {
            expect(
                screen.getByText('PASSWORD MUST BE AT LEAST 8 CHARACTERS AND INCLUDE A NUMBER.')
            ).toBeTruthy();
        });
        expect(signUp).not.toHaveBeenCalled();
    });

    it('shows the API error message when the email already exists', async () => {
        jest.mocked(signUp).mockRejectedValue(
            new AuthError('An account with this email already exists', 'EMAIL_EXISTS')
        );

        render(<SignUpScreen />);
        fireEvent.changeText(screen.getByTestId('email-input'), 'taken@example.com');
        fireEvent.changeText(screen.getByTestId('password-input'), 'password123');
        fireEvent.press(screen.getByTestId('submit-button'));

        await waitFor(() => {
            expect(screen.getByText('AN ACCOUNT WITH THIS EMAIL ALREADY EXISTS')).toBeTruthy();
        });
        expect(mockRefreshSession).not.toHaveBeenCalled();
    });

    it('calls signUp with trimmed email and password on success', async () => {
        render(<SignUpScreen />);
        fireEvent.changeText(screen.getByTestId('email-input'), '  new@example.com  ');
        fireEvent.changeText(screen.getByTestId('password-input'), 'password123');
        fireEvent.press(screen.getByTestId('submit-button'));

        await waitFor(() => {
            expect(signUp).toHaveBeenCalledWith('new@example.com', 'password123');
        });
    });

    it('calls refreshSession after successful sign-up', async () => {
        render(<SignUpScreen />);
        fireEvent.changeText(screen.getByTestId('email-input'), 'new@example.com');
        fireEvent.changeText(screen.getByTestId('password-input'), 'password123');
        fireEvent.press(screen.getByTestId('submit-button'));

        await waitFor(() => {
            expect(mockRefreshSession).toHaveBeenCalledTimes(1);
        });
    });

    it('navigates to login when the header LOGIN button is pressed', () => {
        render(<SignUpScreen />);
        fireEvent.press(screen.getByTestId('header-login-button'));
        expect(mockReplace).toHaveBeenCalledWith('/login');
    });
});
