import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { signUp, AuthError } from '@/src/api/auth';
import SignUpScreen from './sign-up';

const meta: Meta<typeof SignUpScreen> = {
    title: 'Screens/Auth/SignUp',
    component: SignUpScreen,
    parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof SignUpScreen>;

// ── Idle ─────────────────────────────────────────────────────────────────────

export const Default: Story = {};

// ── Validation errors ─────────────────────────────────────────────────────────

export const EmptyFieldsError: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByTestId('submit-button'));
        await waitFor(() => expect(canvas.getByTestId('alert-message-text')).toBeTruthy());
        await waitFor(() =>
            expect(canvas.getByText('PLEASE ENTER YOUR EMAIL AND PASSWORD.')).toBeTruthy()
        );
    },
};

export const PasswordTooShort: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByTestId('email-input'), 'user@example.com');
        await userEvent.type(canvas.getByTestId('password-input'), 'short');
        await userEvent.click(canvas.getByTestId('submit-button'));
        await waitFor(() =>
            expect(
                canvas.getByText('PASSWORD MUST BE AT LEAST 8 CHARACTERS AND INCLUDE A NUMBER.')
            ).toBeTruthy()
        );
    },
};

// ── API error states ───────────────────────────────────────────────────────────

export const EmailAlreadyExists: Story = {
    play: async ({ canvasElement }) => {
        // Set mock inside play so it works in both the Storybook browser UI and the test runner.
        (signUp as ReturnType<typeof fn>).mockRejectedValue(
            new AuthError('An account with this email already exists', 'EMAIL_EXISTS')
        );
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByTestId('email-input'), 'taken@example.com');
        await userEvent.type(canvas.getByTestId('password-input'), 'password123');
        await userEvent.click(canvas.getByTestId('submit-button'));
        await waitFor(() =>
            expect(canvas.getByText('AN ACCOUNT WITH THIS EMAIL ALREADY EXISTS')).toBeTruthy()
        );
    },
};

// ── Loading state ─────────────────────────────────────────────────────────────

export const Loading: Story = {
    play: async ({ canvasElement }) => {
        // Never resolves — keeps the spinner visible indefinitely.
        (signUp as ReturnType<typeof fn>).mockImplementation(() => new Promise(() => {}));
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByTestId('email-input'), 'user@example.com');
        await userEvent.type(canvas.getByTestId('password-input'), 'password123');
        await userEvent.click(canvas.getByTestId('submit-button'));
    },
};

// ── More validation errors ────────────────────────────────────────────────────

export const InvalidEmail: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByTestId('email-input'), 'notanemail');
        await userEvent.type(canvas.getByTestId('password-input'), 'password123');
        await userEvent.click(canvas.getByTestId('submit-button'));
        await waitFor(() =>
            expect(canvas.getByText('PLEASE ENTER A VALID EMAIL ADDRESS.')).toBeTruthy()
        );
    },
};

// ── More API error states ─────────────────────────────────────────────────────

export const NetworkError: Story = {
    play: async ({ canvasElement }) => {
        (signUp as ReturnType<typeof fn>).mockRejectedValue(
            new AuthError('Sign up failed', 'UNKNOWN')
        );
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByTestId('email-input'), 'user@example.com');
        await userEvent.type(canvas.getByTestId('password-input'), 'password123');
        await userEvent.click(canvas.getByTestId('submit-button'));
        await waitFor(() => expect(canvas.getByText('SIGN UP FAILED')).toBeTruthy());
    },
};

export const Success: Story = {
    play: async ({ canvasElement }) => {
        (signUp as ReturnType<typeof fn>).mockResolvedValue(undefined);
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByTestId('email-input'), 'user@example.com');
        await userEvent.type(canvas.getByTestId('password-input'), 'password123');
        await userEvent.click(canvas.getByTestId('submit-button'));
        // refreshSession is called — no error alert should be visible
        await waitFor(() => expect(canvas.queryByTestId('alert-message')).toBeNull());
    },
};

// ── OAuth coming soon ─────────────────────────────────────────────────────────

export const ComingSoon: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByTestId('google-button'));
        await waitFor(() => expect(canvas.getByText('COMING SOON')).toBeTruthy());
    },
};
