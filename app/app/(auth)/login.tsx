import { signIn } from '@/src/api/auth';
import { useAuth } from '@/src/context/AuthContext';
import { AlertMessage } from '@/components/alert-message';
import { AuthHeader } from '@/components/AuthHeader';
import { EthosTextInput } from '@/components/text-input';
import { OAuthButton } from '@/components/oauth-button';
import { colors } from '@/constants/theme';
import { styles } from './login.styles';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';

export default function LoginScreen() {
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
            <AuthHeader
                rightAction={{
                    label: 'SIGN UP',
                    onPress: () => router.replace('/sign-up' as any),
                    testID: 'header-signup-button',
                }}
            />

            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Card ──────────────────────────────────────────── */}
                <View style={styles.cardShadow}>
                    <View style={styles.card} testID="login-card">
                        <Text style={styles.heading}>WELCOME BACK.</Text>
                        <Text style={styles.subheading}>ENTER YOUR CREDENTIALS TO CONTINUE.</Text>

                        <View style={styles.divider} />

                        {/* Email */}
                        <Text style={styles.label}>EMAIL ADDRESS</Text>
                        <EthosTextInput
                            placeholder="Enter your email address"
                            value={email}
                            onChangeText={setEmail}
                            returnKeyType="next"
                            testID="email-input"
                        />

                        {/* Password header row */}
                        <View style={styles.passwordHeader}>
                            <Text style={styles.label}>PASSWORD</Text>
                            <Text style={styles.forgot} testID="forgot-button">
                                FORGOT?
                            </Text>
                        </View>
                        <EthosTextInput
                            placeholder="Enter your password"
                            isPassword
                            value={password}
                            onChangeText={setPassword}
                            returnKeyType="done"
                            onSubmitEditing={handleSubmit}
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
                                    <View style={styles.buttonContent}>
                                        <Text style={styles.buttonText}>CONTINUE</Text>
                                        <Text style={styles.buttonIcon}>→</Text>
                                    </View>
                                )}
                            </Pressable>
                        </View>

                        {/* OTP button */}
                        <View style={styles.otpButtonShadow}>
                            <Pressable
                                style={styles.otpButton}
                                onPress={() => {}}
                                disabled
                                testID="otp-button"
                            >
                                <Text style={styles.otpButtonText}>SEND EMAIL OTP</Text>
                            </Pressable>
                        </View>

                        {/* OR LOGIN WITH separator */}
                        <View style={styles.separator} testID="oauth-separator">
                            <View style={styles.separatorLine} />
                            <Text style={styles.separatorText}>OR LOGIN WITH</Text>
                            <View style={styles.separatorLine} />
                        </View>

                        {/* OAuth row — side by side */}
                        <View style={styles.oauthRow}>
                            <OAuthButton
                                provider="apple"
                                testID="apple-button"
                                style={styles.oauthFlex}
                            />
                            <OAuthButton
                                provider="google"
                                testID="google-button"
                                style={styles.oauthFlex}
                            />
                        </View>

                        <View style={styles.divider} />

                        {/* Footer link */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>{"DON'T HAVE AN ACCOUNT? "}</Text>
                            <Link href={'/sign-up' as any} testID="signup-link">
                                <Text style={styles.footerLink}>SIGN UP</Text>
                            </Link>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
