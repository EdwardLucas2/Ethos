import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';

type Props = {
    size?: number;
};

export function EthosLogo({ size = 64 }: Props) {
    const radius = Math.round(size * 0.22);
    return (
        <View style={[styles.container, { width: size, height: size, borderRadius: radius }]}>
            <Ionicons name="flash" size={size * 0.52} color={colors.yellow} />
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
