import { signIn } from '@/src/api/auth';
import { useAuth } from '@/src/context/AuthContext';
import { EthosLogo } from '@/components/ethos-logo';
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
            testID="login-screen"
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Logo ─────────────────────────────────── */}
                <View style={styles.logoWrapper}>
                    <EthosLogo size={72} />
                </View>

                {/* ── Heading ───────────────────────────────── */}
                <Text style={styles.heading}>WELCOME BACK.</Text>
                <Text style={styles.subheading}>Enter your credentials to access the vault.</Text>

                {/* ── Card ──────────────────────────────────── */}
                <View style={styles.cardShadow}>
                    <View style={styles.card} testID="login-card">
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

                        {/* Password header row */}
                        <View style={styles.passwordHeader}>
                            <Text style={styles.label}>PASSWORD</Text>
                            <Text style={styles.forgot} testID="forgot-button">
                                FORGOT?
                            </Text>
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

                        {/* Send Email OTP button */}
                        <View style={styles.otpButtonShadow}>
                            <Pressable
                                style={styles.otpButton}
                                onPress={() => {}}
                                disabled
                                testID="otp-button"
                            >
                                <Text style={styles.otpButtonIcon}>🔑</Text>
                                <Text style={styles.otpButtonText}>SEND EMAIL OTP</Text>
                            </Pressable>
                        </View>

                        {/* Divider */}
                        <View style={styles.orDivider}>
                            <View style={styles.orLine} />
                            <Text style={styles.orText}>OR CONNECT WITH</Text>
                            <View style={styles.orLine} />
                        </View>

                        {/* Social buttons */}
                        <View style={styles.socialRow}>
                            <View style={styles.socialButtonShadow}>
                                <Pressable
                                    style={styles.socialButton}
                                    onPress={() => {}}
                                    disabled
                                    testID="apple-button"
                                >
                                    <Text style={styles.socialButtonIcon}>iOS</Text>
                                    <Text style={styles.socialButtonText}>APPLE</Text>
                                </Pressable>
                            </View>
                            <View style={styles.socialButtonShadow}>
                                <Pressable
                                    style={styles.socialButton}
                                    onPress={() => {}}
                                    disabled
                                    testID="google-button"
                                >
                                    <Text style={styles.socialButtonIcon}>🌐</Text>
                                    <Text style={styles.socialButtonText}>GOOGLE</Text>
                                </Pressable>
                            </View>
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
        backgroundColor: colors.surfaceRaised,
    },

    // Content
    container: {
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
    },

    // Logo
    logoWrapper: {
        marginBottom: spacing.md,
    },

    // Heading
    heading: {
        fontFamily: typography.fonts.black,
        fontSize: 48,
        color: colors.ink,
        fontStyle: 'italic',
        textAlign: 'center',
        textTransform: 'uppercase',
        marginBottom: spacing.xs,
        lineHeight: 52,
        letterSpacing: -1,
    },
    subheading: {
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        color: colors.inkSecondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.md,
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
        padding: spacing.md,
        overflow: 'visible',
    },

    // Form fields
    label: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: colors.ink,
        letterSpacing: 1,
        marginBottom: spacing.xs,
        textTransform: 'uppercase',
    },
    passwordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    forgot: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: colors.blue,
        letterSpacing: 1,
        textTransform: 'uppercase',
        textDecorationLine: 'underline',
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

    // Continue button
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
    buttonText: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: colors.white,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },

    // OTP button
    otpButtonShadow: {
        marginTop: spacing.md,
        marginBottom: spacing.xs,
        marginRight: spacing.xs,
        ...shadows.sm,
    },
    otpButton: {
        backgroundColor: colors.yellow,
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        paddingVertical: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    otpButtonIcon: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: colors.ink,
    },
    otpButtonText: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: colors.ink,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },

    // OR divider
    orDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.lg,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    orLine: {
        flex: 1,
        height: 2,
        backgroundColor: colors.ink,
    },
    orText: {
        fontFamily: typography.fonts.regular,
        fontSize: 11,
        color: colors.inkSecondary,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

    // Social row
    socialRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    socialButtonShadow: {
        flex: 1,
        marginBottom: spacing.xs,
        marginRight: spacing.xs,
        ...shadows.sm,
    },
    socialButton: {
        flex: 1,
        backgroundColor: colors.surfaceRaised,
        borderWidth: borderWidth.structural,
        borderColor: colors.ink,
        paddingVertical: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    socialButtonIcon: {
        fontFamily: typography.fonts.bold,
        fontSize: 13,
        color: colors.ink,
    },
    socialButtonText: {
        fontFamily: typography.fonts.bold,
        fontSize: 13,
        color: colors.ink,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

    // Footer
    footer: {
        flexDirection: 'row',
        marginTop: spacing.lg,
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    footerText: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        color: colors.inkSecondary,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    footerLink: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        color: colors.blue,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});
