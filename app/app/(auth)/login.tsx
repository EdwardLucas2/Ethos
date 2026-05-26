import { signIn } from '@/src/api/auth';
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

export default function LoginScreen() {
    const { refreshSession } = useAuth();
    const router = useRouter();

    const passwordRef = useRef<TextInput>(null);
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
                        onSubmitEditing={() => passwordRef.current?.focus()}
                        testID="email-input"
                    />

                    <FormField
                        ref={passwordRef}
                        label="PASSWORD"
                        placeholder="Enter your password"
                        containerStyle={{ marginTop: spacing.md }}
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
                        <TextButton
                            label="SIGN UP"
                            onPress={() => router.push('/sign-up')}
                            testID="signup-link"
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
        marginBottom: spacing.sm,
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
    otpButton: {
        marginTop: spacing.md,
    },
    oauthRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    oauthFlex: {
        flex: 1,
    },
    forgot: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: colors.blue,
        letterSpacing: 1,
        textTransform: 'uppercase',
        textDecorationLine: 'underline',
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
