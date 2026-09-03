import type { Meta, StoryObj } from '@storybook/react';
import { PlaceholderScreen } from './placeholder-screen';

const meta: Meta<typeof PlaceholderScreen> = {
    title: 'Components/PlaceholderScreen',
    component: PlaceholderScreen,
    args: {
        avatarUri: null,
        title: 'Coming Soon',
    },
};

export default meta;
type Story = StoryObj<typeof PlaceholderScreen>;

export const Contracts: Story = {
    args: {
        activeTab: 'contracts',
        message: 'Your full contract history will live here.',
    },
};

export const Friends: Story = {
    args: {
        activeTab: 'friends',
        message: 'Adding and managing friends will live here.',
    },
};
