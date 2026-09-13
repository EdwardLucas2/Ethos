import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { AlertBanner, AlertBannerType } from '../alert-banner';
import { colors } from '@/constants/theme';

describe('AlertBanner', () => {
    it.each<[AlertBannerType, string]>([
        ['verify', colors.blue],
        ['challenge', colors.yellow],
        ['settle', colors.red],
        ['owed', colors.yellow],
        ['pay-up', colors.red],
    ])('uses the correct background for %s', (type, backgroundColor) => {
        render(
            <AlertBanner
                type={type}
                message="msg"
                actionLabel="GO"
                onPress={jest.fn()}
                testID="banner"
            />
        );
        expect(screen.getByTestId('banner')).toHaveStyle({ backgroundColor });
    });

    it('renders the message and action label in uppercase', () => {
        render(
            <AlertBanner
                type="verify"
                message="tap to verify"
                actionLabel="verify"
                onPress={jest.fn()}
            />
        );
        expect(screen.getByText('TAP TO VERIFY')).toBeTruthy();
        expect(screen.getByText('VERIFY')).toBeTruthy();
    });

    it('calls onPress when tapped', () => {
        const onPress = jest.fn();
        render(
            <AlertBanner
                type="settle"
                message="msg"
                actionLabel="SETTLE"
                onPress={onPress}
                testID="banner"
            />
        );
        fireEvent.press(screen.getByTestId('banner'));
        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
