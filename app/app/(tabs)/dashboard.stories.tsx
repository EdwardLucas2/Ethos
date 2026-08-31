import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
    useGetContractsMeActive,
    useGetContractsMePendingResolution,
    useGetNotifications,
    useGetUsersMe,
    usePostContracts,
} from '@/src/api';
import DashboardScreen from './dashboard';

// Fixture data kept local (not imported from @/src/api) since @/src/api mocks
// via a Vite alias in .storybook/main.ts — `tsc` still resolves that import
// against the real Orval-generated module, which has no such exports. Same
// pattern as (tabs)/__tests__/dashboard.test.tsx's local fixtures.

type MockFn = ReturnType<typeof fn>;

function successOf<T>(data: T) {
    return { data: { data, status: 200 }, isLoading: false, isError: false };
}

const ME = {
    id: 'user-1',
    displayName: 'Edward',
    tag: 'edward1',
    email: 'e@e.com',
    avatarUrl: null,
};

const ACTIVE_CONTRACTS = [
    {
        contractId: 'contract-1',
        name: 'Gym 3x/Week',
        cycleNumber: 3,
        startDate: '2026-08-29',
        endDate: '2026-09-05',
        myProgress: { completed: 2, pending: 0, total: 3 },
        unreviewedEvidenceCount: 0,
        participants: [
            { displayName: 'Edward', avatarUrl: null, completed: 2, pending: 0, total: 3 },
            { displayName: 'Alex', avatarUrl: null, completed: 1, pending: 1, total: 3 },
        ],
    },
    {
        contractId: 'contract-2',
        name: 'No Sugar',
        cycleNumber: 1,
        startDate: '2026-08-30',
        endDate: '2026-09-06',
        myProgress: { completed: 0, pending: 0, total: 1 },
        unreviewedEvidenceCount: 2,
        participants: [
            { displayName: 'Edward', avatarUrl: null, completed: 0, pending: 0, total: 1 },
            { displayName: 'Sarah', avatarUrl: null, completed: 1, pending: 0, total: 1 },
            { displayName: 'Mike', avatarUrl: null, completed: 1, pending: 0, total: 1 },
        ],
    },
];

const PENDING_CONTRACTS = [
    {
        contractId: 'contract-3',
        contractName: 'Morning Run',
        cycleNumber: 2,
        unreviewedEvidenceCount: 3,
        participants: [
            { displayName: 'Edward', completed: 3, total: 3 },
            { displayName: 'Alex', completed: 1, total: 3 },
        ],
    },
];

const NOTIFICATIONS = [
    {
        id: 'notif-1',
        type: 'evidence_uploaded',
        createdAt: '2026-08-30T23:00:00Z',
        submitterName: 'Alex',
        contractId: 'contract-1',
        contractName: 'Gym 3x/Week',
        cycleNumber: 3,
        evidenceId: 'evidence-1',
    },
    {
        id: 'notif-2',
        type: 'contract_invited',
        createdAt: '2026-08-30T22:00:00Z',
        contractId: 'contract-4',
        contractName: 'No Sugar',
        inviterName: 'Sarah',
    },
    {
        id: 'notif-3',
        type: 'cycle_pending_resolution',
        createdAt: '2026-08-30T00:00:00Z',
        contractId: 'contract-3',
        contractName: 'Morning Run',
        cycleNumber: 2,
    },
];

const mockCreateContractMutateAsync = fn()
    .mockName('createContract.mutateAsync')
    .mockResolvedValue({ data: { id: 'new-contract' }, status: 201 });

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
