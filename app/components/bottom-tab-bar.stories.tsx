import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { BottomTabBar } from './bottom-tab-bar';

const meta: Meta<typeof BottomTabBar> = {
    title: 'Components/BottomTabBar',
    component: BottomTabBar,
    args: {
        activeTab: 'home',
    },
    decorators: [
        (Story) => (
            <View style={{ width: 390 }}>
                <Story />
            </View>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof BottomTabBar>;

export const Home: Story = {};

export const Contracts: Story = {
    args: { activeTab: 'contracts' },
};

export const Friends: Story = {
    args: { activeTab: 'friends' },
};
