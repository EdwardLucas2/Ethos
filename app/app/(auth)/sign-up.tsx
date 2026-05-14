import { signUp } from '@/src/api/auth';
import { useAuth } from '@/src/context/AuthContext';
import { AlertMessage } from '@/components/alert-message';
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
            testID="sign-up-screen"
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

                        {/* Social buttons */}
                        <View style={styles.socialButtonShadow}>
                            <Pressable
                                style={styles.socialButton}
                                onPress={() => {}}
                                disabled
                                testID="google-button"
                            >
                                <View style={styles.socialButtonInner}>
                                    <Text style={styles.socialIcon}>G</Text>
                                    <Text style={styles.socialButtonText}>GOOGLE</Text>
                                </View>
                            </Pressable>
                        </View>

                        <View style={[styles.socialButtonShadow, { marginTop: spacing.sm }]}>
                            <Pressable
                                style={styles.socialButton}
                                onPress={() => {}}
                                disabled
                                testID="apple-button"
                            >
                                <View style={styles.socialButtonInner}>
                                    <Text style={styles.socialIcon}>iOS</Text>
                                    <Text style={styles.socialButtonText}>APPLE</Text>
                                </View>
                            </Pressable>
                        </View>

                        {/* OR USE EMAIL separator */}
                        <View style={styles.separator} testID="social-separator">
                            <View style={styles.separatorLine} />
                            <Text style={styles.separatorText}>OR USE EMAIL</Text>
                            <View style={styles.separatorLine} />
                        </View>

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
                        {error ? (
                            <View style={styles.alertWrapper}>
                                <AlertMessage
                                    message={error}
                                    severity="error"
                                    onDismiss={() => setError(null)}
                                />
                            </View>
                        ) : null}

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
                                    <View style={styles.buttonContent}>
                                        <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
                                        <Text style={styles.buttonIcon}>→</Text>
                                    </View>
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

                {/* ── Bottom footer bar ─────────────────────── */}
                <View style={styles.bottomFooter} testID="bottom-footer">
                    <Text style={styles.bottomFooterLeft}>ETHOS PROTOCOL © 2024</Text>
                    <View style={styles.bottomFooterLinks}>
                        <Text style={styles.bottomFooterLink}>TERMS</Text>
                        <Text style={styles.bottomFooterLink}>PRIVACY</Text>
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
        paddingBottom: 0,
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
        fontSize: 32,
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

    // Social buttons
    socialButtonShadow: {
        marginRight: spacing.xs,
        marginBottom: spacing.xs,
        ...shadows.sm,
    },
    socialButton: {
        backgroundColor: colors.surfaceRaised,
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        paddingVertical: spacing.sm + 2,
        paddingHorizontal: spacing.md,
        opacity: 0.4,
    },
    socialButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    socialIcon: {
        fontFamily: typography.fonts.bold,
        fontSize: 13,
        color: colors.ink,
        marginRight: spacing.sm,
    },
    socialButtonText: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: colors.ink,
        letterSpacing: 2,
    },

    // OR USE EMAIL separator
    separator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.md,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.inkSecondary,
        opacity: 0.4,
    },
    separatorText: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        color: colors.inkSecondary,
        letterSpacing: 1,
        marginHorizontal: spacing.sm,
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

    // Alert wrapper
    alertWrapper: {
        marginTop: spacing.sm,
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
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        paddingVertical: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonPressed: {
        opacity: 0.9,
        transform: [{ translateX: 2 }, { translateY: 2 }],
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonText: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: colors.white,
        letterSpacing: 2,
    },
    buttonIcon: {
        fontFamily: typography.fonts.bold,
        fontSize: 18,
        color: colors.white,
        marginLeft: spacing.sm,
    },

    // Footer (inside card)
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

    // Bottom footer bar
    bottomFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.lg,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderTopWidth: borderWidth.structural,
        borderTopColor: colors.ink,
        backgroundColor: colors.surface,
    },
    bottomFooterLeft: {
        fontFamily: typography.fonts.bold,
        fontSize: 10,
        color: colors.inkSecondary,
        letterSpacing: 1,
    },
    bottomFooterLinks: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    bottomFooterLink: {
        fontFamily: typography.fonts.bold,
        fontSize: 10,
        color: colors.inkSecondary,
        letterSpacing: 1,
    },
});
