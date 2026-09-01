import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { AlertMessage, AlertMessageProps } from '../alert-message';
import { colors } from '@/constants/theme';

describe('AlertMessage', () => {
    it.each<[NonNullable<AlertMessageProps['severity']>, string, string]>([
        ['error', colors.red, colors.surfaceRaised],
        ['warning', colors.yellow, colors.ink],
        ['info', colors.blue, colors.surfaceRaised],
    ])('uses the correct colors for %s severity', (severity, backgroundColor, textColor) => {
        render(<AlertMessage message="uh oh" severity={severity} testID="alert" />);
        expect(screen.getByTestId('alert')).toHaveStyle({ backgroundColor });
        expect(screen.getByTestId('alert-text')).toHaveStyle({ color: textColor });
    });

    it('renders the message in uppercase', () => {
        render(<AlertMessage message="something went wrong" testID="alert" />);
        expect(screen.getByText('SOMETHING WENT WRONG')).toBeTruthy();
    });

    it('does not call onDismiss when not dismissible', () => {
        const onDismiss = jest.fn();
        render(<AlertMessage message="uh oh" onDismiss={onDismiss} testID="alert" />);
        fireEvent.press(screen.getByTestId('alert'));
        expect(onDismiss).not.toHaveBeenCalled();
    });

    it('calls onDismiss when dismissible and tapped', () => {
        const onDismiss = jest.fn();
        render(<AlertMessage message="uh oh" dismissible onDismiss={onDismiss} testID="alert" />);
        fireEvent.press(screen.getByTestId('alert'));
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });
});
