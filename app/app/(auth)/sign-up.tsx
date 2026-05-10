import { signUp } from '@/src/api/auth';
import { useAuth } from '@/src/context/AuthContext';
import { EthosLogo } from '@/components/ethos-logo';
import { borderWidth, colors, shadows, spacing, typography } from '@/constants/theme';
import { Link, useRouter } from 'expo-router';
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

export default function SignUpScreen() {
    const { refreshSession } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        if (!email.trim() || !password) {
            setError('Please enter your email and password.');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setError(null);
        setLoading(true);

        try {
            await signUp(email.trim(), password);
            await refreshSession();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Sign up failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* ── Header bar ────────────────────────────── */}
            <View style={styles.header}>
                <EthosLogo size={36} />
                <Pressable
                    style={styles.loginButton}
                    onPress={() => router.replace('/login' as any)}
                    testID="header-login-button"
                >
                    <Text style={styles.loginButtonText}>LOGIN</Text>
                </Pressable>
            </View>

            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Card ──────────────────────────────────── */}
                <View style={styles.cardShadow}>
                    <View style={styles.card}>
                        <Text style={styles.heading}>CREATE ACCOUNT</Text>
                        <Text style={styles.subheading}>ENTER YOUR DETAILS TO GET STARTED.</Text>

                        <View style={styles.divider} />

                        {/* Email */}
                        <Text style={styles.label}>EMAIL ADDRESS</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="NAME@EMAIL.COM"
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
                        <Text style={[styles.label, { marginTop: spacing.md }]}>PASSWORD</Text>
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

                        {/* Create account button */}
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
                                    <Text style={styles.buttonText}>CREATE ACCOUNT →</Text>
                                )}
                            </Pressable>
                        </View>

                        <View style={styles.divider} />

                        {/* Footer link */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>ALREADY HAVE AN ACCOUNT? </Text>
                            <Link href={'/login' as any} testID="login-link">
                                <Text style={styles.footerLink}>LOGIN</Text>
                            </Link>
                        </View>
                    </View>
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

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.md,
        borderBottomWidth: borderWidth.structural,
        borderBottomColor: colors.ink,
    },
    loginButton: {
        backgroundColor: colors.ink,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 2,
    },
    loginButtonText: {
        fontFamily: typography.fonts.bold,
        fontSize: 13,
        color: colors.white,
        letterSpacing: 1,
    },

    // Content
    container: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.xl,
    },

    // Card
    cardShadow: {
        width: '100%',
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

    // Heading
    heading: {
        fontFamily: typography.fonts.black,
        fontSize: 28,
        color: colors.ink,
        marginBottom: spacing.xs,
    },
    subheading: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        color: colors.inkSecondary,
        letterSpacing: 1,
        marginBottom: spacing.md,
    },

    // Divider
    divider: {
        height: borderWidth.structural,
        backgroundColor: colors.ink,
        marginVertical: spacing.md,
    },

    // Form fields
    label: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: colors.ink,
        letterSpacing: 1,
        marginBottom: spacing.xs,
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
        marginTop: spacing.lg,
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
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    footerText: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        color: colors.ink,
        letterSpacing: 1,
    },
    footerLink: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        color: colors.blue,
        letterSpacing: 1,
    },
});
