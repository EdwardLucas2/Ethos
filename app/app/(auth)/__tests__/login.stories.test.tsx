import { render, screen } from '@testing-library/react-native';
import { composeStories } from '@storybook/react';
import React from 'react';
import * as stories from '../login.stories';

// ─── Module mocks ─────────────────────────────────────────────────────────────
// Mirror what Storybook's viteFinal aliases provide in the browser.

jest.mock('@/src/api/auth', () => ({
    ...jest.requireActual('@/src/api/auth'),
    signIn: jest.fn().mockResolvedValue(undefined),
}));

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

// ─── Setup ────────────────────────────────────────────────────────────────────

import { useAuth } from '@/src/context/AuthContext';

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAuth).mockReturnValue({
        refreshSession: jest.fn().mockResolvedValue(undefined),
        session: null,
        isLoading: false,
        signOut: jest.fn(),
    });
});

// ─── Composed stories ─────────────────────────────────────────────────────────

const { Default, EmptyFieldsError, WrongCredentials, Loading } = composeStories(stories);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Login stories (portable)', () => {
    it('Default — renders the form', () => {
        render(<Default />);
        expect(screen.getByTestId('email-input')).toBeTruthy();
        expect(screen.getByTestId('password-input')).toBeTruthy();
        expect(screen.getByTestId('submit-button')).toBeTruthy();
        expect(screen.getByTestId('signup-link')).toBeTruthy();
    });

    it('EmptyFieldsError — renders the form', () => {
        render(<EmptyFieldsError />);
        expect(screen.getByTestId('submit-button')).toBeTruthy();
    });

    it('WrongCredentials — renders the form', () => {
        render(<WrongCredentials />);
        expect(screen.getByTestId('submit-button')).toBeTruthy();
    });

    it('Loading — renders the form', () => {
        render(<Loading />);
        expect(screen.getByTestId('submit-button')).toBeTruthy();
    });
});
