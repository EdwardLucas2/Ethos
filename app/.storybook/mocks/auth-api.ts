// Spy replacements for @/src/api/auth.
// AuthError is kept real so stories can construct and throw it.
import { fn } from 'storybook/test';

export class AuthError extends Error {
    constructor(
        message: string,
        public readonly code: 'WRONG_CREDENTIALS' | 'EMAIL_EXISTS' | 'UNKNOWN'
    ) {
        super(message);
    }
}

export const signIn = fn().mockName('signIn').mockResolvedValue(undefined);
export const signUp = fn().mockName('signUp').mockResolvedValue(undefined);
