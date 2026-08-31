// Renders the real AntDesign glyphs in Storybook. expo-vector-icons normally
// loads its icon font through expo-font's Font.loadAsync, which depends on
// Expo's own asset registry (wired up by Metro) — unavailable in this Vite
// build. Loading the same .ttf via a plain @font-face and looking codepoints
// up in the same glyph map @expo/vector-icons ships gets the real icons
// without needing Expo's asset pipeline.
import './antdesign-font.css';
import glyphMap from '@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/AntDesign.json';
import { StyleProp, Text, TextStyle } from 'react-native';

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
    const codepoint = (glyphMap as Record<string, number>)[name];
    return (
        <Text
            testID={testID}
            style={[
                {
                    fontFamily: 'AntDesign',
                    fontSize: size,
                    color,
                    lineHeight: size,
                    width: size,
                    textAlign: 'center',
                },
                style,
            ]}
        >
            {codepoint !== undefined ? String.fromCodePoint(codepoint) : '?'}
        </Text>
    );
}
