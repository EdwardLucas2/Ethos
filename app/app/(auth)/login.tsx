import { signIn } from '@/src/services/auth';
import { useAuth } from '@/src/context/AuthContext';
import { AlertMessage } from '@/components/alert-message';
import { AuthHeader } from '@/components/auth-header';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { TextButton } from '@/components/text-button';
import { FormField } from '@/components/form-field';
import { OAuthButton } from '@/components/oauth-button';
import { colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { styles } from './login.styles';

export default function LoginScreen() {
    const { refreshSession } = useAuth();
    const router = useRouter();

    const passwordRef = useRef<TextInput>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showComingSoon, setShowComingSoon] = useState(false);

    async function handleSubmit() {
        if (loading) return;
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
                    onPress: () => router.replace('/sign-up'),
                    testID: 'header-signup-button',
                }}
            />

            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Card ──────────────────────────────────────────── */}
                <Card testID="login-card">
                    <Text style={styles.heading}>WELCOME BACK.</Text>
                    <Text style={styles.subheading}>ENTER YOUR CREDENTIALS TO CONTINUE.</Text>

                    <View style={styles.divider} />

                    <FormField
                        label="EMAIL ADDRESS"
                        placeholder="Enter your email address"
                        value={email}
                        onChangeText={setEmail}
                        returnKeyType="next"
                        keyboardType="email-address"
                        autoComplete="email"
                        onSubmitEditing={() => passwordRef.current?.focus()}
                        testID="email-input"
                    />

                    <FormField
                        ref={passwordRef}
                        label="PASSWORD"
                        placeholder="Enter your password"
                        containerStyle={styles.passwordField}
                        autoComplete="current-password"
                        rightElement={
                            <Text style={styles.forgot} testID="forgot-button">
                                FORGOT?
                            </Text>
                        }
                        isPassword
                        value={password}
                        onChangeText={setPassword}
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit}
                        testID="password-input"
                    />

                    {error ? (
                        <View style={styles.alertWrapper}>
                            <AlertMessage
                                message={error}
                                severity="error"
                                dismissible
                                onDismiss={() => setError(null)}
                            />
                        </View>
                    ) : null}

                    <Button
                        label="CONTINUE"
                        onPress={handleSubmit}
                        loading={loading}
                        showArrow
                        testID="submit-button"
                        style={styles.submitButton}
                    />
                    <Button
                        label="SEND EMAIL OTP"
                        backgroundColor={colors.yellow}
                        disabled
                        testID="otp-button"
                        style={styles.otpButton}
                    />

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
                            onPress={() => setShowComingSoon(true)}
                            style={styles.oauthFlex}
                        />
                        <OAuthButton
                            provider="google"
                            testID="google-button"
                            onPress={() => setShowComingSoon(true)}
                            style={styles.oauthFlex}
                        />
                    </View>

                    {showComingSoon ? (
                        <View style={styles.alertWrapper}>
                            <AlertMessage
                                testID="coming-soon-alert"
                                message="Coming soon"
                                severity="info"
                                dismissible
                                onDismiss={() => setShowComingSoon(false)}
                            />
                        </View>
                    ) : null}

                    <View style={styles.divider} />

                    {/* Footer link */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>{"DON'T HAVE AN ACCOUNT? "}</Text>
                        <TextButton
                            label="SIGN UP"
                            onPress={() => router.replace('/sign-up')}
                            testID="signup-link"
                        />
                    </View>
                </Card>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
