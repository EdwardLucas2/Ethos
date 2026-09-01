import { render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { ProgressBar } from '../progress-bar';

function flattenChildStyle(node: unknown): { flex?: number } {
    const style = (node as { props: { style: object } }).props.style;
    return StyleSheet.flatten(style);
}

describe('ProgressBar', () => {
    it('renders verified and pending segments proportional to total', () => {
        const tree = render(
            <ProgressBar verified={2} pending={1} total={4} testID="bar" />
        ).toJSON() as { children: unknown[] };

        expect(tree.children).toHaveLength(2);
        expect(flattenChildStyle(tree.children[0]).flex).toBeCloseTo(0.5);
        expect(flattenChildStyle(tree.children[1]).flex).toBeCloseTo(0.25);
    });

    it('renders no segments when total is 0', () => {
        const tree = render(
            <ProgressBar verified={0} pending={0} total={0} testID="bar" />
        ).toJSON() as { children: unknown[] | null };

        expect(tree.children).toBeNull();
    });

    it('clamps verified to a full bar when verified exceeds total', () => {
        const tree = render(
            <ProgressBar verified={5} pending={0} total={4} testID="bar" />
        ).toJSON() as { children: unknown[] };

        expect(tree.children).toHaveLength(1);
        expect(flattenChildStyle(tree.children[0]).flex).toBeCloseTo(1);
    });

    it('clamps pending so verified + pending never exceeds the total', () => {
        const tree = render(
            <ProgressBar verified={4} pending={4} total={4} testID="bar" />
        ).toJSON() as { children: unknown[] };

        expect(tree.children).toHaveLength(1);
        expect(flattenChildStyle(tree.children[0]).flex).toBeCloseTo(1);
    });
});
