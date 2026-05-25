import { Text } from 'react-native';

const ICON_CHARS: Record<string, string> = {
    warning: '!',
    'info-circle': 'i',
    close: '×',
    check: '✓',
};

type AntDesignProps = {
    name: string;
    size?: number;
    color?: string;
    style?: object;
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
