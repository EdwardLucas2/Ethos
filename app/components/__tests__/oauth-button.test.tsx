import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { OAuthButton } from '../oauth-button';

describe('OAuthButton', () => {
    it('renders the GOOGLE label for the google provider', () => {
        render(<OAuthButton provider="google" testID="btn" />);
        expect(screen.getByText('G')).toBeTruthy();
        expect(screen.getByText('GOOGLE')).toBeTruthy();
    });

    it('renders the APPLE label for the apple provider', () => {
        render(<OAuthButton provider="apple" testID="btn" />);
        expect(screen.getByText('iOS')).toBeTruthy();
        expect(screen.getByText('APPLE')).toBeTruthy();
    });

    it('calls onPress when tapped', () => {
        const onPress = jest.fn();
        render(<OAuthButton provider="google" onPress={onPress} testID="btn" />);
        fireEvent.press(screen.getByTestId('btn'));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
        const onPress = jest.fn();
        render(<OAuthButton provider="google" onPress={onPress} disabled testID="btn" />);
        fireEvent.press(screen.getByTestId('btn'));
        expect(onPress).not.toHaveBeenCalled();
    });
});
