import { fn } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { TopBar } from './top-bar';

const meta: Meta<typeof TopBar> = {
    title: 'Components/TopBar',
    component: TopBar,
    decorators: [
        (Story) => (
            <View style={{ width: 390 }}>
                <Story />
            </View>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof TopBar>;

export const Tab: Story = {
    args: { variant: 'tab', avatarUri: null },
};

export const TabWithAvatar: Story = {
    args: { variant: 'tab', avatarUri: 'https://i.pravatar.cc/80' },
};

export const Stack: Story = {
    args: { variant: 'stack', onBack: fn() },
};
