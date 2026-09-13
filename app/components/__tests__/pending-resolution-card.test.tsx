import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { PendingResolutionCard } from '../pending-resolution-card';

describe('PendingResolutionCard', () => {
    it('renders singular REVIEW when reviewsNeeded is 1', () => {
        render(
            <PendingResolutionCard
                contractName="GYM 3X/WEEK"
                verified={3}
                total={4}
                reviewsNeeded={1}
                onPress={jest.fn()}
            />
        );
        expect(screen.getByText('1 REVIEW NEEDED')).toBeTruthy();
    });

    it.each([0, 2, 3])('renders plural REVIEWS when reviewsNeeded is %i', (reviewsNeeded) => {
        render(
            <PendingResolutionCard
                contractName="GYM 3X/WEEK"
                verified={3}
                total={4}
                reviewsNeeded={reviewsNeeded}
                onPress={jest.fn()}
            />
        );
        expect(screen.getByText(`${reviewsNeeded} REVIEWS NEEDED`)).toBeTruthy();
    });

    it('calls onPress when tapped', () => {
        const onPress = jest.fn();
        render(
            <PendingResolutionCard
                contractName="GYM 3X/WEEK"
                verified={3}
                total={4}
                reviewsNeeded={1}
                onPress={onPress}
                testID="card"
            />
        );
        fireEvent.press(screen.getByTestId('card'));
        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
