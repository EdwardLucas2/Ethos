import type { Meta, StoryObj } from '@storybook/react';
import { AlertMessage } from './alert-message';

const meta: Meta<typeof AlertMessage> = {
    title: 'Components/AlertMessage',
    component: AlertMessage,
    parameters: {
        layout: 'centered',
    },
    args: {
        message: 'Invalid credentials. Check your access key.',
        severity: 'error',
        dismissible: true,
    },
};

export default meta;
type Story = StoryObj<typeof AlertMessage>;

export const Default: Story = {};

export const Info: Story = {
    args: {
        severity: 'info',
        message: 'Your session will expire in 5 minutes.',
    },
};

export const Warning: Story = {
    args: {
        severity: 'warning',
        message: 'You are approaching your usage limit.',
    },
};

export const NonDismissible: Story = {
    args: {
        dismissible: false,
        message: 'This message cannot be dismissed.',
    },
};
