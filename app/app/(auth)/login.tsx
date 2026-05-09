import { signIn } from '@/src/api/auth';
import { useAuth } from '@/src/context/AuthContext';
import { borderWidth, colors, shadows, spacing, typography } from '@/constants/theme';
import { Link } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function LoginScreen() {
    const { refreshSession } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        if (!email.trim() || !password) {
            setError('Please enter your email and password.');
            return;
        }

        setError(null);
        setLoading(true);

        try {
            await signIn(email.trim(), password);
            await refreshSession();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Sign in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Logo ─────────────────────────────────── */}
                <View style={styles.logoWrapper}>
                    <View style={styles.logoBolt}>
                        <Text style={styles.logoBoltText}>⚡</Text>
                    </View>
                </View>

                {/* ── Heading ───────────────────────────────── */}
                <Text style={styles.heading}>WELCOME BACK.</Text>
                <Text style={styles.subheading}>Enter your credentials to access the vault.</Text>

                {/* ── Card ──────────────────────────────────── */}
                <View style={styles.cardShadow}>
                    <View style={styles.card}>
                        {/* Email */}
                        <Text style={styles.label}>EMAIL ADDRESS</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="ARCHITECT@ETHOS.NETWORK"
                            placeholderTextColor={colors.inkSecondary}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="email-address"
                            returnKeyType="next"
                            value={email}
                            onChangeText={setEmail}
                            testID="email-input"
                        />

                        {/* Password */}
                        <View style={styles.passwordHeader}>
                            <Text style={styles.label}>PASSWORD</Text>
                            <Text style={styles.forgot}>FORGOT?</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••••••"
                            placeholderTextColor={colors.inkSecondary}
                            secureTextEntry
                            returnKeyType="done"
                            onSubmitEditing={handleSubmit}
                            value={password}
                            onChangeText={setPassword}
                            testID="password-input"
                        />

                        {/* Error */}
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        {/* Continue button */}
                        <View style={styles.buttonShadow}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.button,
                                    pressed && styles.buttonPressed,
                                ]}
                                onPress={handleSubmit}
                                disabled={loading}
                                testID="submit-button"
                            >
                                {loading ? (
                                    <ActivityIndicator color={colors.white} />
                                ) : (
                                    <Text style={styles.buttonText}>CONTINUE</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* ── Footer ────────────────────────────────── */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>NEW TO THE NETWORK? </Text>
                    <Link href={'/sign-up' as any} testID="signup-link">
                        <Text style={styles.footerLink}>REQUEST ACCESS</Text>
                    </Link>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    container: {
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xxl,
        paddingBottom: spacing.xl,
    },

    // Logo
    logoWrapper: {
        marginBottom: spacing.lg,
    },
    logoBolt: {
        width: 56,
        height: 56,
        backgroundColor: colors.yellow,
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        alignItems: 'center',
        justifyContent: 'center',
        // Hard shadow: black square offset 4px right + down
        ...shadows.sm,
        marginBottom: spacing.xs,
        marginRight: spacing.xs,
    },
    logoBoltText: {
        fontSize: 28,
    },

    // Heading
    heading: {
        fontFamily: typography.fonts.black,
        fontSize: 36,
        color: colors.ink,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subheading: {
        fontFamily: typography.fonts.regular,
        fontSize: 16,
        color: colors.inkSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.md,
    },

    // Card
    cardShadow: {
        width: '100%',
        // Extra margin to give the shadow room
        marginBottom: spacing.xs,
        marginRight: spacing.xs,
        ...shadows.sm,
    },
    card: {
        width: '100%',
        backgroundColor: colors.surfaceRaised,
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        padding: spacing.lg,
    },

    // Form fields
    label: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: colors.ink,
        letterSpacing: 1,
        marginBottom: spacing.xs,
    },
    passwordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.md,
    },
    forgot: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: colors.blue,
        letterSpacing: 1,
    },
    input: {
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        color: colors.ink,
        backgroundColor: colors.surfaceRaised,
        marginBottom: spacing.xs,
    },

    // Error
    errorText: {
        fontFamily: typography.fonts.regular,
        fontSize: 13,
        color: colors.red,
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
    },

    // Button
    buttonShadow: {
        marginTop: spacing.md,
        marginBottom: spacing.xs,
        marginRight: spacing.xs,
        ...shadows.sm,
    },
    button: {
        backgroundColor: colors.blue,
        paddingVertical: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonPressed: {
        opacity: 0.9,
        transform: [{ translateX: 2 }, { translateY: 2 }],
    },
    buttonText: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: colors.white,
        letterSpacing: 2,
    },

    // Footer
    footer: {
        flexDirection: 'row',
        marginTop: spacing.xl,
        alignItems: 'center',
    },
    footerText: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: colors.ink,
        letterSpacing: 1,
    },
    footerLink: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: colors.blue,
        letterSpacing: 1,
    },
});
