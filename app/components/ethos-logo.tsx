import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

type Props = {
    size?: number;
};

// Bolt path on a 100×100 viewBox.
// Wider x spread (18→78) makes it chunky; tighter y range (8→92) keeps it squat.
const BOLT_PATH = 'M 62 8 L 18 56 L 46 56 L 34 92 L 78 44 L 50 44 Z';

export function EthosLogo({ size = 64 }: Props) {
    const radius = Math.round(size * 0.22);
    const boltSize = size * 0.75;
    return (
        <View style={[styles.container, { width: size, height: size, borderRadius: radius }]}>
            <Svg width={boltSize} height={boltSize} viewBox="0 0 100 100">
                <Defs>
                    <LinearGradient id="boltGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FFD95A" stopOpacity="1" />
                        <Stop offset="1" stopColor="#E8960C" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Path
                    d={BOLT_PATH}
                    fill="url(#boltGrad)"
                    stroke="url(#boltGrad)"
                    strokeWidth={4}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1B3461',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
