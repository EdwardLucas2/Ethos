import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { ProgressBar } from './progress-bar';

const meta: Meta<typeof ProgressBar> = {
    title: 'Components/ProgressBar',
    component: ProgressBar,
    args: {
        verified: 2,
        pending: 1,
        total: 3,
        size: 'compact',
    },
    // ProgressBar is width: '100%' — without a concrete width to resolve
    // against, Storybook's centered layout collapses it to a sliver.
    decorators: [
        (Story) => (
            <View style={{ width: 390 }}>
                <Story />
            </View>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {};

export const Standard: Story = {
    args: { size: 'standard' },
};

export const Empty: Story = {
    args: { verified: 0, pending: 0, total: 3 },
};

export const Full: Story = {
    args: { verified: 3, pending: 0, total: 3 },
};
