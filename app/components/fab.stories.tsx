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
    // relatively-positioned ancestor to anchor against. The dashed border marks
    // this box as a stand-in for "some screen", not part of the component —
    // FAB itself has no background beyond its own red square.
    decorators: [
        (Story) => (
            <View
                style={{
                    width: 320,
                    height: 200,
                    position: 'relative',
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderStyle: 'dashed',
                    borderColor: '#B0B0AA',
                }}
            >
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
