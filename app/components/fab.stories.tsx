import { fn } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { FAB } from './fab';

const meta: Meta<typeof FAB> = {
    title: 'Components/FAB',
    component: FAB,
    args: {
        onPress: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof FAB>;

export const Default: Story = {};

export const Loading: Story = {
    args: { loading: true },
};
