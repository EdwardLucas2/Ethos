import type { Meta, StoryObj } from '@storybook/react';
import { ThemedText } from './themed-text';

const meta: Meta<typeof ThemedText> = {
    title: 'Components/ThemedText',
    component: ThemedText,
    args: {
        children: 'The quick brown fox',
    },
};

export default meta;
type Story = StoryObj<typeof ThemedText>;

export const Default: Story = {};

export const Title: Story = {
    args: { type: 'title' },
};

export const Subtitle: Story = {
    args: { type: 'subtitle' },
};

export const SemiBold: Story = {
    args: { type: 'defaultSemiBold' },
};

export const Link: Story = {
    args: { type: 'link', children: 'Tap here' },
};
