import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Button } from '../button';
import { colors } from '@/constants/theme';

describe('Button', () => {
    it('renders the label', () => {
        render(<Button label="CONTINUE" testID="btn" />);
        expect(screen.getByText('CONTINUE')).toBeTruthy();
    });

    it('calls onPress when tapped', () => {
        const onPress = jest.fn();
        render(<Button label="GO" onPress={onPress} testID="btn" />);
        fireEvent.press(screen.getByTestId('btn'));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
        const onPress = jest.fn();
        render(<Button label="GO" onPress={onPress} disabled testID="btn" />);
        fireEvent.press(screen.getByTestId('btn'));
        expect(onPress).not.toHaveBeenCalled();
    });

    it('does not call onPress when loading', () => {
        const onPress = jest.fn();
        render(<Button label="GO" onPress={onPress} loading testID="btn" />);
        fireEvent.press(screen.getByTestId('btn'));
        expect(onPress).not.toHaveBeenCalled();
    });

    it('hides the label and shows a spinner when loading', () => {
        render(<Button label="GO" loading testID="btn" />);
        expect(screen.queryByText('GO')).toBeNull();
    });

    it('shows the arrow when showArrow is true', () => {
        render(<Button label="NEXT" showArrow />);
        expect(screen.getByText('→')).toBeTruthy();
    });

    it('does not show the arrow by default', () => {
        render(<Button label="NEXT" />);
        expect(screen.queryByText('→')).toBeNull();
    });

    it('uses white text on blue background', () => {
        render(<Button label="GO" backgroundColor={colors.blue} testID="btn" />);
        const label = screen.getByText('GO');
        expect(label.props.style).toEqual(
            expect.arrayContaining([expect.objectContaining({ color: colors.white })])
        );
    });

    it('uses ink text on yellow background', () => {
        render(<Button label="GO" backgroundColor={colors.yellow} testID="btn" />);
        const label = screen.getByText('GO');
        expect(label.props.style).toEqual(
            expect.arrayContaining([expect.objectContaining({ color: colors.ink })])
        );
    });
});
