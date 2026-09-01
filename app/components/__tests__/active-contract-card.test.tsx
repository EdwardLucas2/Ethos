import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { ActiveContractCard, CtaState } from '../active-contract-card';
import { colors } from '@/constants/theme';

const baseProps = {
    contractName: 'GYM 3X/WEEK',
    opponentLabel: 'VS ALEX',
    verified: 2,
    pending: 1,
    total: 4,
    timeRemaining: '2D LEFT',
    ctaLabel: 'SNAP PROOF',
};

describe('ActiveContractCard', () => {
    it.each<[CtaState, string]>([
        ['snap', colors.blue],
        ['snap-urgent', colors.red],
        ['review', colors.ink],
        ['caught-up', colors.inkSecondary],
    ])('uses the correct CTA background for %s', (ctaState, backgroundColor) => {
        render(
            <ActiveContractCard
                {...baseProps}
                ctaState={ctaState}
                onPress={jest.fn()}
                onCta={jest.fn()}
            />
        );
        expect(screen.getByTestId('active-contract-card-cta')).toHaveStyle({ backgroundColor });
    });

    it('calls onPress when the card is tapped', () => {
        const onPress = jest.fn();
        render(
            <ActiveContractCard
                {...baseProps}
                ctaState="snap"
                onPress={onPress}
                onCta={jest.fn()}
            />
        );
        fireEvent.press(screen.getByTestId('active-contract-card'));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('calls onCta when the CTA is tapped', () => {
        const onCta = jest.fn();
        render(
            <ActiveContractCard {...baseProps} ctaState="snap" onPress={jest.fn()} onCta={onCta} />
        );
        fireEvent.press(screen.getByTestId('active-contract-card-cta'));
        expect(onCta).toHaveBeenCalledTimes(1);
    });

    it('shows the overdue badge in red even when the CTA state is not urgent', () => {
        render(
            <ActiveContractCard
                {...baseProps}
                timeRemaining="OVERDUE"
                ctaState="snap"
                onPress={jest.fn()}
                onCta={jest.fn()}
            />
        );
        expect(screen.getByText('OVERDUE')).toHaveStyle({ color: colors.red });
    });

    it('disables the CTA when caught up', () => {
        const onCta = jest.fn();
        render(
            <ActiveContractCard
                {...baseProps}
                ctaState="caught-up"
                onPress={jest.fn()}
                onCta={onCta}
            />
        );
        fireEvent.press(screen.getByTestId('active-contract-card-cta'));
        expect(onCta).not.toHaveBeenCalled();
    });
});
