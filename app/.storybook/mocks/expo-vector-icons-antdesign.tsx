import { StyleProp, Text, TextStyle } from 'react-native';

// One representative character per AntDesign icon name actually used in the
// app, so Storybook previews something legible instead of a generic '?' for
// every icon this file doesn't know about yet.
const ICON_CHARS: Record<string, string> = {
    warning: '!',
    'info-circle': 'i',
    close: '×',
    check: '✓',
    'arrow-left': '←',
    right: '›',
    plus: '+',
    home: '⌂',
    'file-text': '▤',
    team: '◔',
    'check-circle': '✓',
    mail: '✉',
    wallet: '▯',
    trophy: '♛',
    'credit-card': '▭',
    camera: '◎',
};

type AntDesignProps = {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
    testID?: string;
};

export default function AntDesign({
    name,
    size = 24,
    color = '#000',
    style,
    testID,
}: AntDesignProps) {
    return (
        <Text
            testID={testID}
            style={[
                {
                    fontSize: size,
                    color,
                    lineHeight: size,
                    width: size,
                    textAlign: 'center',
                    fontWeight: 'bold',
                },
                style,
            ]}
        >
            {ICON_CHARS[name] ?? '?'}
        </Text>
    );
}
