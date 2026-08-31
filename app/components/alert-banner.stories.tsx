import { fn } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { AlertBanner } from './alert-banner';

const meta: Meta<typeof AlertBanner> = {
    title: 'Components/AlertBanner',
    component: AlertBanner,
    args: {
        type: 'verify',
        message: 'Alex uploaded proof. [VERIFY]',
        onPress: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof AlertBanner>;

export const Default: Story = {};

export const Challenge: Story = {
    args: { type: 'challenge', message: 'Alex challenged you. [VIEW]' },
};

export const Settle: Story = {
    args: { type: 'settle', message: "Last week's results are in. [SETTLE]" },
};

export const Owed: Story = {
    args: { type: 'owed', message: 'Alex owes you. [COLLECT]' },
};

export const PayUp: Story = {
    args: { type: 'pay-up', message: 'You owe Alex. [PAY UP]' },
};
