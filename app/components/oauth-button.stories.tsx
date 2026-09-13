import { fn } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { OAuthButton } from './oauth-button';

const meta: Meta<typeof OAuthButton> = {
    title: 'Components/OAuthButton',
    component: OAuthButton,
    parameters: {
        layout: 'centered',
    },
    args: {
        provider: 'google',
        onPress: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof OAuthButton>;

export const Google: Story = {};

export const Apple: Story = {
    args: { provider: 'apple' },
};

export const Disabled: Story = {
    args: { disabled: true },
};
