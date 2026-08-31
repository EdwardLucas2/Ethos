import { fn } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './empty-state';

const meta: Meta<typeof EmptyState> = {
    title: 'Components/EmptyState',
    component: EmptyState,
    args: {
        message: 'No active contracts. Challenge your friends!',
        ctaLabel: 'Create a Contract',
        onCta: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {};
