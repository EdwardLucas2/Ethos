import { borderWidth, colors, shadows, spacing } from '@/constants/theme';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

type Props = {
    children: ReactNode;
    shadow?: 'sm' | 'md' | 'lg';
    style?: ViewStyle;
    testID?: string;
};

export function Card({ children, shadow = 'sm', style, testID }: Props) {
    return (
        <View style={[styles.outer, shadows[shadow]]}>
            <View style={[styles.inner, style]} testID={testID}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outer: {
        width: '100%',
        marginBottom: spacing.xs,
        marginRight: spacing.xs,
    },
    inner: {
        width: '100%',
        backgroundColor: colors.surfaceRaised,
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        padding: spacing.lg,
    },
});
