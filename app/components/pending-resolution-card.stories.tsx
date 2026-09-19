import { fn } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { PendingResolutionCard } from './pending-resolution-card';

const meta: Meta<typeof PendingResolutionCard> = {
    title: 'Components/PendingResolutionCard',
    component: PendingResolutionCard,
    args: {
        contractName: 'Morning Run',
        verified: 3,
        total: 3,
        reviewsNeeded: 2,
        onPress: fn(),
    },
    // PendingResolutionCard is width: '100%' — without a concrete width to
    // resolve against, each story's differing content collapses to a
    // different content-driven width in Storybook's centered layout.
    decorators: [
        (Story) => (
            <View style={{ width: 390 }}>
                <Story />
            </View>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof PendingResolutionCard>;

export const Default: Story = {};

export const NoReviewsNeeded: Story = {
    args: { reviewsNeeded: 0 },
};

export const SingleReviewNeeded: Story = {
    args: { reviewsNeeded: 1 },
};
