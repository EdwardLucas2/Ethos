import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
    useGetContractsMeActive,
    useGetContractsMePendingResolution,
    useGetNotifications,
    useGetUsersMe,
    usePostContracts,
} from '@/src/api';
import {
    ACTIVE_CONTRACTS,
    ME,
    NOTIFICATIONS,
    PENDING_CONTRACTS,
} from '@/.storybook/mocks/dashboard-fixtures';
import DashboardScreen from './dashboard';

type MockFn = ReturnType<typeof fn>;

function successOf<T>(data: T) {
    return { data, isLoading: false, isError: false };
}

const mockCreateContractMutateAsync = fn()
    .mockName('createContract.mutateAsync')
    .mockResolvedValue({ id: 'new-contract' });

const meta: Meta<typeof DashboardScreen> = {
    title: 'Screens/Tabs/Dashboard',
    component: DashboardScreen,
    parameters: { layout: 'fullscreen' },
    beforeEach: () => {
        // Reset every hook back to its populated-dummy-data default before each story,
        // since stories below mutate these mocks' return values directly. A mock's
        // return value set only at module scope (in the mocks/api.tsx default export)
        // doesn't reliably survive into the test-runner's execution context — see the
        // same note in login.stories.tsx — so every hook is (re-)set here explicitly.
        (useGetUsersMe as MockFn).mockReturnValue(successOf(ME));
        (useGetNotifications as MockFn).mockReturnValue(successOf(NOTIFICATIONS));
        (useGetContractsMeActive as MockFn).mockReturnValue(successOf(ACTIVE_CONTRACTS));
        (useGetContractsMePendingResolution as MockFn).mockReturnValue(
            successOf(PENDING_CONTRACTS)
        );
        (usePostContracts as MockFn).mockReturnValue({
            mutateAsync: mockCreateContractMutateAsync,
            isPending: false,
        });
    },
};

export default meta;
type Story = StoryObj<typeof DashboardScreen>;

// ── Populated (matches the dummy backend exactly) ───────────────────────────

export const Default: Story = {};

// ── Loading skeleton ─────────────────────────────────────────────────────────
//
// These three stories override the query-hook mocks in `beforeEach` (which runs
// before the component mounts), not `play` (which runs after). The mocks here
// are plain functions, not reactive hooks — changing a mock's return value
// after the component has already rendered with the default data does nothing,
// since nothing re-renders it. `beforeEach` is the hook that actually lands the
// override before first render.

export const Loading: Story = {
    beforeEach: () => {
        (useGetNotifications as MockFn).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        });
        (useGetContractsMeActive as MockFn).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        });
        (useGetContractsMePendingResolution as MockFn).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        });
    },
};

// ── Empty (no active or pending-resolution contracts) ───────────────────────

export const Empty: Story = {
    beforeEach: () => {
        (useGetNotifications as MockFn).mockReturnValue(successOf([]));
        (useGetContractsMeActive as MockFn).mockReturnValue(successOf([]));
        (useGetContractsMePendingResolution as MockFn).mockReturnValue(successOf([]));
    },
};

// ── Error ────────────────────────────────────────────────────────────────────

export const ErrorState: Story = {
    beforeEach: () => {
        (useGetContractsMeActive as MockFn).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        });
    },
};

// ── FAB create-contract flow ─────────────────────────────────────────────────

export const CreateContractFlow: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByTestId('fab'));
        await waitFor(() => expect(mockCreateContractMutateAsync).toHaveBeenCalled());
    },
};
