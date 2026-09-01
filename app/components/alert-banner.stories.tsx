import { fn } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { AlertBanner } from './alert-banner';

const meta: Meta<typeof AlertBanner> = {
    title: 'Components/AlertBanner',
    component: AlertBanner,
    args: {
        type: 'verify',
        message: 'Alex uploaded proof.',
        actionLabel: 'Verify',
        onPress: fn(),
    },
    // AlertBanner is width: '100%' — without a concrete width to resolve
    // against, Storybook's centered layout collapses it to content width.
    decorators: [
        (Story) => (
            <View style={{ width: 390 }}>
                <Story />
            </View>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof AlertBanner>;

export const Default: Story = {};

export const Challenge: Story = {
    args: { type: 'challenge', message: 'Alex challenged you.', actionLabel: 'View' },
};

export const Settle: Story = {
    args: { type: 'settle', message: "Last week's results are in.", actionLabel: 'Settle' },
};

export const Owed: Story = {
    args: { type: 'owed', message: 'Alex owes you.', actionLabel: 'Collect' },
};

export const PayUp: Story = {
    args: { type: 'pay-up', message: 'You owe Alex.', actionLabel: 'Pay Up' },
};
