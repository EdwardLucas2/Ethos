import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { signIn, AuthError } from '@/src/api/auth';
import LoginScreen from './login';

const meta: Meta<typeof LoginScreen> = {
    title: 'Screens/Auth/Login',
    component: LoginScreen,
    parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof LoginScreen>;

// ── Idle ─────────────────────────────────────────────────────────────────────

export const Default: Story = {};

// ── Validation errors ─────────────────────────────────────────────────────────

export const EmptyFieldsError: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByTestId('submit-button'));
        await waitFor(() =>
            expect(canvas.getByText('Please enter your email and password.')).toBeTruthy()
        );
    },
};

// ── API error states ───────────────────────────────────────────────────────────

export const WrongCredentials: Story = {
    play: async ({ canvasElement }) => {
        // Set mock inside play so it works in both the Storybook browser UI and the test runner.
        (signIn as ReturnType<typeof fn>).mockRejectedValue(
            new AuthError('Invalid email or password', 'WRONG_CREDENTIALS')
        );
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByTestId('email-input'), 'user@example.com');
        await userEvent.type(canvas.getByTestId('password-input'), 'wrongpassword');
        await userEvent.click(canvas.getByTestId('submit-button'));
        await waitFor(() => expect(canvas.getByText('Invalid email or password')).toBeTruthy());
    },
};

// ── Loading state ─────────────────────────────────────────────────────────────

export const Loading: Story = {
    play: async ({ canvasElement }) => {
        // Never resolves — keeps the spinner visible indefinitely.
        (signIn as ReturnType<typeof fn>).mockImplementation(() => new Promise(() => {}));
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByTestId('email-input'), 'user@example.com');
        await userEvent.type(canvas.getByTestId('password-input'), 'password123');
        await userEvent.click(canvas.getByTestId('submit-button'));
    },
};
