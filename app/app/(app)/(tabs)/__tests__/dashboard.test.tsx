import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import DashboardScreen, { daysUntil } from '../dashboard';
import {
    useGetContractsMeActive,
    useGetContractsMePendingResolution,
    useGetNotifications,
    useGetUsersMe,
    usePostContracts,
} from '@/src/api';
import { useAuth } from '@/src/context/AuthContext';
import { ME } from '@/.storybook/mocks/dashboard-fixtures';

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('@/src/api', () => ({
    useGetUsersMe: jest.fn(),
    useGetNotifications: jest.fn(),
    useGetContractsMeActive: jest.fn(),
    useGetContractsMePendingResolution: jest.fn(),
    usePostContracts: jest.fn(),
    getGetContractsMeActiveQueryKey: jest.fn(() => ['contracts-me-active']),
    getGetContractsMePendingResolutionQueryKey: jest.fn(() => ['contracts-me-pending-resolution']),
    getGetNotificationsQueryKey: jest.fn(() => ['notifications']),
}));

jest.mock('@/src/context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

const mockInvalidateQueries = jest.fn().mockResolvedValue(undefined);
jest.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────
// Local rather than shared with dashboard-fixtures.ts — these use a
// far-future endDate so CTA-state assertions stay stable regardless of when
// the suite runs, unlike the Storybook fixtures' near-term "today" dates.

function successOf<T>(data: T) {
    return { data, isLoading: false, isError: false };
}

const LOADING = { data: undefined, isLoading: true, isError: false };
const ERRORED = { data: undefined, isLoading: false, isError: true };

const ACTIVE_CONTRACT = {
    contractId: 'contract-1',
    name: 'Gym 3x/Week',
    cycleNumber: 3,
    startDate: '2026-01-01',
    endDate: '2099-01-01',
    myProgress: { completed: 1, pending: 0, total: 3 },
    unreviewedEvidenceCount: 0,
    participants: [
        {
            userId: 'user-1',
            displayName: 'Edward',
            completed: 1,
            pending: 0,
            total: 3,
            isSelf: true,
        },
        {
            userId: 'user-2',
            displayName: 'Alex',
            completed: 2,
            pending: 0,
            total: 3,
            isSelf: false,
        },
    ],
};

const SQUAD_CONTRACT = {
    contractId: 'contract-3',
    name: 'No Sugar',
    cycleNumber: 1,
    startDate: '2026-01-01',
    endDate: '2099-01-01',
    myProgress: { completed: 1, pending: 0, total: 3 },
    unreviewedEvidenceCount: 1,
    participants: [
        {
            userId: 'user-1',
            displayName: 'Edward',
            completed: 1,
            pending: 0,
            total: 3,
            isSelf: true,
        },
        {
            userId: 'user-3',
            displayName: 'Sarah',
            completed: 2,
            pending: 0,
            total: 3,
            isSelf: false,
        },
        {
            userId: 'user-4',
            displayName: 'Mike',
            completed: 0,
            pending: 1,
            total: 3,
            isSelf: false,
        },
    ],
};

const PENDING_CONTRACT = {
    contractId: 'contract-2',
    contractName: 'Morning Run',
    cycleNumber: 2,
    unreviewedEvidenceCount: 3,
    participants: [
        { userId: 'user-1', displayName: 'Edward', completed: 3, total: 3, isSelf: true },
    ],
};

const NOTIFICATION = {
    id: 'notif-1',
    type: 'evidence_uploaded',
    createdAt: '2026-01-01T00:00:00Z',
    submitterName: 'Alex',
    contractId: 'contract-1',
    contractName: 'Gym 3x/Week',
    cycleNumber: 3,
    evidenceId: 'evidence-1',
};

const mockMutateAsync = jest.fn();

// Sets the three dashboard queries to their happy-path shape; pass only the
// fields a test cares about, e.g. mockQueries({ active: [ACTIVE_CONTRACT] }).
function mockQueries(
    overrides: { notifications?: unknown[]; active?: unknown[]; pending?: unknown[] } = {}
) {
    jest.mocked(useGetNotifications).mockReturnValue(
        successOf(overrides.notifications ?? []) as never
    );
    jest.mocked(useGetContractsMeActive).mockReturnValue(
        successOf(overrides.active ?? []) as never
    );
    jest.mocked(useGetContractsMePendingResolution).mockReturnValue(
        successOf(overrides.pending ?? []) as never
    );
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAuth).mockReturnValue({
        session: 'token',
        isLoading: false,
        refreshSession: jest.fn(),
        signOut: jest.fn(),
    });
    jest.mocked(useGetUsersMe).mockReturnValue(successOf(ME) as never);
    jest.mocked(usePostContracts).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
    } as never);
    mockQueries();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DashboardScreen', () => {
    describe('loading', () => {
        it('shows a skeleton while any query is loading', () => {
            jest.mocked(useGetNotifications).mockReturnValue(LOADING as never);
            jest.mocked(useGetContractsMeActive).mockReturnValue(LOADING as never);
            jest.mocked(useGetContractsMePendingResolution).mockReturnValue(LOADING as never);

            render(<DashboardScreen />);
            expect(screen.getByTestId('dashboard-skeleton')).toBeTruthy();
            expect(screen.queryByTestId('active-arena')).toBeNull();
            expect(screen.queryByTestId('fab')).toBeNull();
        });

        it('keeps showing the skeleton while only the current user is still loading', () => {
            jest.mocked(useGetUsersMe).mockReturnValue(LOADING as never);

            render(<DashboardScreen />);
            expect(screen.getByTestId('dashboard-skeleton')).toBeTruthy();
            expect(screen.queryByTestId('empty-state')).toBeNull();
        });
    });

    describe('empty state', () => {
        it('shows the empty state when there are no contracts', () => {
            render(<DashboardScreen />);
            expect(screen.getByTestId('empty-state')).toBeTruthy();
            expect(screen.queryByTestId('fab')).toBeNull();
        });

        it('disables the empty-state CTA while a create-contract mutation is pending', () => {
            jest.mocked(usePostContracts).mockReturnValue({
                mutateAsync: mockMutateAsync,
                isPending: true,
            } as never);

            render(<DashboardScreen />);
            expect(screen.getByTestId('empty-state-cta').props.accessibilityState.disabled).toBe(
                true
            );
        });
    });

    describe('alerts', () => {
        it('shows alerts instead of the empty state when there are notifications but no contracts', () => {
            mockQueries({ notifications: [NOTIFICATION] });

            render(<DashboardScreen />);
            expect(screen.queryByTestId('empty-state')).toBeNull();
            expect(screen.getByTestId('alert-stack')).toBeTruthy();
        });

        it('hides the alert stack when there are no unread notifications', () => {
            mockQueries({ active: [ACTIVE_CONTRACT] });

            render(<DashboardScreen />);
            expect(screen.queryByTestId('alert-stack')).toBeNull();
            expect(screen.getByTestId('active-arena')).toBeTruthy();
        });

        it('renders an alert banner for each unread notification and navigates on tap', () => {
            mockQueries({ notifications: [NOTIFICATION], active: [ACTIVE_CONTRACT] });

            render(<DashboardScreen />);
            const banner = screen.getByTestId('alert-banner-notif-1');
            expect(banner).toBeTruthy();
            expect(screen.getByText(/ALEX UPLOADED PROOF/)).toBeTruthy();

            fireEvent.press(banner);
            expect(mockPush).toHaveBeenCalledWith('/contract/contract-1/3/evidence/evidence-1');
        });
    });

    describe('active arena', () => {
        it('shows a generic review CTA for a contract with more than one opponent', () => {
            mockQueries({ active: [SQUAD_CONTRACT] });

            render(<DashboardScreen />);
            expect(screen.getByText('REVIEW PROOF')).toBeTruthy();
            expect(screen.queryByText(/REVIEW SARAH'S PROOF/)).toBeNull();
        });

        it('shows the active contract count badge and pending-resolution section', () => {
            mockQueries({ active: [ACTIVE_CONTRACT], pending: [PENDING_CONTRACT] });

            render(<DashboardScreen />);
            expect(screen.getByText('1 live')).toBeTruthy();
            expect(screen.getByTestId('pending-resolution')).toBeTruthy();
            expect(screen.getByText('Morning Run')).toBeTruthy();
        });
    });

    describe('creating a contract', () => {
        it('creates a contract and navigates to its build screen on FAB press', async () => {
            mockQueries({ active: [ACTIVE_CONTRACT] });
            mockMutateAsync.mockResolvedValue({ id: 'new-contract' });

            render(<DashboardScreen />);
            fireEvent.press(screen.getByTestId('fab'));

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/contract/new-contract/build');
            });
            expect(mockInvalidateQueries).toHaveBeenCalledWith({
                queryKey: ['contracts-me-active'],
            });
            expect(mockInvalidateQueries).toHaveBeenCalledWith({
                queryKey: ['contracts-me-pending-resolution'],
            });
            expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['notifications'] });
        });

        it('shows an error message when contract creation fails', async () => {
            mockQueries({ active: [ACTIVE_CONTRACT] });
            mockMutateAsync.mockRejectedValue(new Error('network error'));

            render(<DashboardScreen />);
            fireEvent.press(screen.getByTestId('fab'));

            await waitFor(() => {
                expect(screen.getByTestId('fab-error')).toBeTruthy();
            });
            expect(mockPush).not.toHaveBeenCalled();
        });
    });

    describe('errors', () => {
        it('shows an error message when a query fails', () => {
            jest.mocked(useGetContractsMeActive).mockReturnValue(ERRORED as never);

            render(<DashboardScreen />);
            expect(screen.getByText(/Couldn't load your dashboard/i)).toBeTruthy();
        });
    });
});

describe('daysUntil', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        // Late in the local day, not local midnight — a UTC-midnight parse of
        // endDate (the prior bug) would misjudge this boundary; local-calendar
        // construction (the fix) is unaffected by what time of day "now" is.
        jest.setSystemTime(new Date(2026, 5, 15, 23, 30));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("returns 0 when endDate is the viewer's current local calendar day", () => {
        expect(daysUntil('2026-06-15')).toBe(0);
    });

    it('returns a negative value when endDate is a local calendar day in the past', () => {
        expect(daysUntil('2026-06-14')).toBe(-1);
    });

    it('returns a positive value when endDate is a local calendar day in the future', () => {
        expect(daysUntil('2026-06-16')).toBe(1);
    });
});
