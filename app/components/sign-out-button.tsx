import { Button } from '@/components/button';
import { useAuth } from '@/src/context/AuthContext';
import { colors } from '@/constants/theme';
import { useState } from 'react';

export function SignOutButton() {
    const { signOut } = useAuth();
    const [loading, setLoading] = useState(false);

    async function handleSignOut() {
        setLoading(true);
        try {
            await signOut();
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button
            label="SIGN OUT"
            onPress={handleSignOut}
            backgroundColor={colors.ink}
            loading={loading}
            testID="sign-out-button"
        />
    );
}
