import { fn } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { ActiveContractCard } from './active-contract-card';

const meta: Meta<typeof ActiveContractCard> = {
    title: 'Components/ActiveContractCard',
    component: ActiveContractCard,
    args: {
        contractName: 'Gym 3x/Week',
        opponentLabel: 'VS ALEX',
        verified: 2,
        pending: 0,
        total: 3,
        timeRemaining: '5 DAYS LEFT',
        ctaState: 'snap',
        ctaLabel: 'SNAP PROOF',
        onPress: fn(),
        onCta: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof ActiveContractCard>;

export const Default: Story = {};

export const SnapUrgent: Story = {
    args: { ctaState: 'snap-urgent', ctaLabel: 'SNAP PROOF', timeRemaining: 'ENDS TODAY' },
};

export const ReviewNeeded: Story = {
    args: {
        ctaState: 'review',
        ctaLabel: "REVIEW ALEX'S PROOF",
        contractName: 'No Sugar',
        opponentLabel: 'SQUAD BATTLE',
        verified: 0,
        pending: 2,
        total: 1,
    },
};

export const CaughtUp: Story = {
    args: { ctaState: 'caught-up', ctaLabel: 'ALL CAUGHT UP', verified: 3, pending: 0, total: 3 },
};
