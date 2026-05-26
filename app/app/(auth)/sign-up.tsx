import { z } from 'zod';
import { signUp } from '@/src/api/auth';
import { useAuth } from '@/src/context/AuthContext';
import { AlertMessage } from '@/components/alert-message';
import { AuthHeader } from '@/components/auth-header';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { TextButton } from '@/components/text-button';
import { FormField } from '@/components/form-field';
import { OAuthButton } from '@/components/oauth-button';
import { borderWidth, colors, spacing, typography } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

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
                <Card>
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

                    <FormField
                        label="EMAIL ADDRESS"
                        placeholder="Enter your email address"
                        value={email}
                        onChangeText={setEmail}
                        returnKeyType="next"
                        keyboardType="email-address"
                        onSubmitEditing={() => passwordRef.current?.focus()}
                        testID="email-input"
                    />

                    <FormField
                        ref={passwordRef}
                        label="PASSWORD"
                        placeholder="Enter a password"
                        containerStyle={{ marginTop: spacing.md }}
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
                        <TextButton
                            label="LOGIN"
                            onPress={() => router.push('/login')}
                            testID="login-link"
                        />
                    </View>
                </Card>
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
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: 0,
    },
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
    divider: {
        height: borderWidth.structural,
        backgroundColor: colors.ink,
        marginVertical: spacing.md,
    },
    alertWrapper: {
        marginTop: spacing.sm,
    },
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
    submitButton: {
        marginTop: spacing.lg,
    },
    oauthGap: {
        marginTop: spacing.sm,
    },
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
});
