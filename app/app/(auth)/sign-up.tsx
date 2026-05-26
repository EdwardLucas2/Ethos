import { z } from 'zod';
import { signUp } from '@/src/api/auth';
import { useAuth } from '@/src/context/AuthContext';
import { AlertMessage } from '@/components/alert-message';
import { AuthHeader } from '@/components/auth-header';
import { Button } from '@/components/button';
import { EthosTextInput } from '@/components/text-input';
import { OAuthButton } from '@/components/oauth-button';
import { styles } from './sign-up.styles';
import { Link, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';

const emailSchema = z.email();

export default function SignUpScreen() {
    const { refreshSession } = useAuth();
    const router = useRouter();
    const passwordRef = useRef<TextInput>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showComingSoon, setShowComingSoon] = useState(false);

    async function handleSubmit() {
        if (!email.trim() || !password) {
            setError('Please enter your email and password.');
            return;
        }
        if (!emailSchema.safeParse(email.trim()).success) {
            setError('Please enter a valid email address.');
            return;
        }
        if (password.length < 8 || !/\d/.test(password)) {
            setError('Password must be at least 8 characters and include a number.');
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
            <AuthHeader
                rightAction={{
                    label: 'LOGIN',
                    onPress: () => router.replace('/login'),
                    testID: 'header-login-button',
                }}
            />

            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Card ──────────────────────────────────────────── */}
                <View style={styles.cardShadow}>
                    <View style={styles.card}>
                        <Text style={styles.heading}>CREATE ACCOUNT</Text>
                        <Text style={styles.subheading}>ENTER YOUR DETAILS TO GET STARTED.</Text>

                        <View style={styles.divider} />

                        {/* Social buttons */}
                        <OAuthButton
                            provider="google"
                            testID="google-button"
                            onPress={() => setShowComingSoon(true)}
                        />
                        <OAuthButton
                            provider="apple"
                            testID="apple-button"
                            onPress={() => setShowComingSoon(true)}
                            style={styles.oauthGap}
                        />

                        {showComingSoon ? (
                            <View style={styles.alertWrapper}>
                                <AlertMessage
                                    message="Coming soon"
                                    severity="info"
                                    dismissible
                                    onDismiss={() => setShowComingSoon(false)}
                                />
                            </View>
                        ) : null}

                        {/* OR USE EMAIL separator */}
                        <View style={styles.separator} testID="social-separator">
                            <View style={styles.separatorLine} />
                            <Text style={styles.separatorText}>OR USE EMAIL</Text>
                            <View style={styles.separatorLine} />
                        </View>

                        {/* Email */}
                        <Text style={styles.label}>EMAIL ADDRESS</Text>
                        <EthosTextInput
                            placeholder="Enter your email address"
                            value={email}
                            onChangeText={setEmail}
                            returnKeyType="next"
                            keyboardType="email-address"
                            onSubmitEditing={() => passwordRef.current?.focus()}
                            testID="email-input"
                        />

                        {/* Password */}
                        <Text style={styles.labelSpaced}>PASSWORD</Text>
                        <EthosTextInput
                            ref={passwordRef}
                            placeholder="Enter a password"
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

                        <Button
                            label="CREATE ACCOUNT"
                            onPress={handleSubmit}
                            loading={loading}
                            showArrow
                            testID="submit-button"
                            style={styles.submitButton}
                        />

                        <View style={styles.divider} />

                        {/* Footer link */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>ALREADY HAVE AN ACCOUNT? </Text>
                            <Link href="/login" testID="login-link">
                                <Text style={styles.footerLink}>LOGIN</Text>
                            </Link>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
