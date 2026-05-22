import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Props = {
    size?: number;
};

// Bolt path on a 100×100 viewBox.
// Wider x spread (18→78) makes it chunky; tighter y range (8→92) keeps it squat.
const BOLT_PATH = 'M 62 8 L 18 56 L 46 56 L 34 92 L 78 44 L 50 44 Z';

export function EthosLogo({ size = 64 }: Props) {
    const boltSize = size * 0.6;
    return (
        <View style={[styles.shadowOffset, { width: size, height: size }]}>
            <View style={[styles.container, { width: size, height: size }]}>
                <Svg width={boltSize} height={boltSize} viewBox="0 0 100 100">
                    <Path
                        d={BOLT_PATH}
                        fill="#000000"
                        stroke="#000000"
                        strokeWidth={4}
                        strokeLinejoin="miter"
                        strokeLinecap="square"
                    />
                </Svg>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    shadowOffset: {
        ...(Platform.select({
            web: { boxShadow: '4px 4px 0px #000000' } as object,
            ios: {
                shadowColor: '#000000',
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 0,
            },
            default: { elevation: 4, shadowColor: '#000000' },
        }) ?? { elevation: 4 }),
    },
    container: {
        backgroundColor: '#FDDC00',
        borderWidth: 3,
        borderColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
