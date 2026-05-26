import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { TextButton } from '../text-button';

describe('TextButton', () => {
    it('renders the label', () => {
        render(<TextButton label="SIGN UP" testID="btn" />);
        expect(screen.getByText('SIGN UP')).toBeTruthy();
    });

    it('calls onPress when tapped', () => {
        const onPress = jest.fn();
        render(<TextButton label="GO" onPress={onPress} testID="btn" />);
        fireEvent.press(screen.getByTestId('btn'));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
        const onPress = jest.fn();
        render(<TextButton label="GO" onPress={onPress} disabled testID="btn" />);
        fireEvent.press(screen.getByTestId('btn'));
        expect(onPress).not.toHaveBeenCalled();
    });
});
