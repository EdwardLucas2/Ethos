import { Button } from '@/components/button';
import { colors, spacing, typography } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

// The Home Dashboard's zero-contracts state (PRD §5.3 "Empty (new user)") —
// replaces the alert stack and contract sections entirely when the caller
// has no active or pending-resolution contracts yet.
export type EmptyStateProps = {
    message: string;
    ctaLabel: string;
    onCta: () => void;
    testID?: string;
};

export function EmptyState({ message, ctaLabel, onCta, testID = 'empty-state' }: EmptyStateProps) {
    return (
        <View style={styles.container} testID={testID}>
            <Text style={styles.message}>{message}</Text>
            <Button
                label={ctaLabel}
                onPress={onCta}
                backgroundColor={colors.red}
                testID={`${testID}-cta`}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
        paddingHorizontal: spacing.lg,
        gap: spacing.lg,
    },
    message: {
        fontFamily: typography.fonts.extraBold,
        fontSize: 18,
        fontStyle: 'italic',
        textTransform: 'uppercase',
        textAlign: 'center',
        color: colors.ink,
    },
});
