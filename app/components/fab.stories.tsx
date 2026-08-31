import { fn } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { FAB } from './fab';

const meta: Meta<typeof FAB> = {
    title: 'Components/FAB',
    component: FAB,
    args: {
        onPress: fn(),
    },
    // FAB is position: 'absolute', anchored by right/bottom — it needs a sized,
    // relatively-positioned ancestor to anchor against, standing in for the
    // screen it's normally fixed to the corner of.
    decorators: [
        (Story) => (
            <View style={{ width: 320, height: 200, position: 'relative' }}>
                <Story />
            </View>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof FAB>;

export const Default: Story = {};

export const Loading: Story = {
    args: { loading: true },
};
