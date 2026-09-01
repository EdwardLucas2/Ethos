import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import DashboardScreen from '../dashboard';
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

function successOf<T>(data: T) {
    return { data, isLoading: false, isError: false };
}

const ACTIVE_CONTRACT = {
    contractId: 'contract-1',
    name: 'Gym 3x/Week',
    cycleNumber: 3,
    startDate: '2026-01-01',
    endDate: '2099-01-01',
    myProgress: { completed: 1, pending: 0, total: 3 },
    unreviewedEvidenceCount: 0,
    participants: [
        { userId: 'user-1', displayName: 'Edward', completed: 1, pending: 0, total: 3 },
        { userId: 'user-2', displayName: 'Alex', completed: 2, pending: 0, total: 3 },
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
        { userId: 'user-1', displayName: 'Edward', completed: 1, pending: 0, total: 3 },
        { userId: 'user-3', displayName: 'Sarah', completed: 2, pending: 0, total: 3 },
        { userId: 'user-4', displayName: 'Mike', completed: 0, pending: 1, total: 3 },
    ],
};

const PENDING_CONTRACT = {
    contractId: 'contract-2',
    contractName: 'Morning Run',
    cycleNumber: 2,
    unreviewedEvidenceCount: 3,
    participants: [{ userId: 'user-1', displayName: 'Edward', completed: 3, total: 3 }],
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
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DashboardScreen', () => {
    it('shows a skeleton while any query is loading', () => {
        jest.mocked(useGetNotifications).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as never);
        jest.mocked(useGetContractsMeActive).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as never);
        jest.mocked(useGetContractsMePendingResolution).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as never);

        render(<DashboardScreen />);
        expect(screen.getByTestId('dashboard-skeleton')).toBeTruthy();
        expect(screen.queryByTestId('active-arena')).toBeNull();
        expect(screen.queryByTestId('fab')).toBeNull();
    });

    it('keeps showing the skeleton while only the current user is still loading', () => {
        jest.mocked(useGetUsersMe).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as never);
        jest.mocked(useGetNotifications).mockReturnValue(successOf([]) as never);
        jest.mocked(useGetContractsMeActive).mockReturnValue(successOf([]) as never);
        jest.mocked(useGetContractsMePendingResolution).mockReturnValue(successOf([]) as never);

        render(<DashboardScreen />);
        expect(screen.getByTestId('dashboard-skeleton')).toBeTruthy();
        expect(screen.queryByTestId('empty-state')).toBeNull();
    });

    it('shows the empty state when there are no contracts', () => {
        jest.mocked(useGetNotifications).mockReturnValue(successOf([]) as never);
        jest.mocked(useGetContractsMeActive).mockReturnValue(successOf([]) as never);
        jest.mocked(useGetContractsMePendingResolution).mockReturnValue(successOf([]) as never);

        render(<DashboardScreen />);
        expect(screen.getByTestId('empty-state')).toBeTruthy();
        expect(screen.queryByTestId('fab')).toBeNull();
    });

    it('shows alerts instead of the empty state when there are notifications but no contracts', () => {
        jest.mocked(useGetNotifications).mockReturnValue(successOf([NOTIFICATION]) as never);
        jest.mocked(useGetContractsMeActive).mockReturnValue(successOf([]) as never);
        jest.mocked(useGetContractsMePendingResolution).mockReturnValue(successOf([]) as never);

        render(<DashboardScreen />);
        expect(screen.queryByTestId('empty-state')).toBeNull();
        expect(screen.getByTestId('alert-stack')).toBeTruthy();
    });

    it('hides the alert stack when there are no unread notifications', () => {
        jest.mocked(useGetNotifications).mockReturnValue(successOf([]) as never);
        jest.mocked(useGetContractsMeActive).mockReturnValue(successOf([ACTIVE_CONTRACT]) as never);
        jest.mocked(useGetContractsMePendingResolution).mockReturnValue(successOf([]) as never);

        render(<DashboardScreen />);
        expect(screen.queryByTestId('alert-stack')).toBeNull();
        expect(screen.getByTestId('active-arena')).toBeTruthy();
    });

    it('renders an alert banner for each unread notification and navigates on tap', () => {
        jest.mocked(useGetNotifications).mockReturnValue(successOf([NOTIFICATION]) as never);
        jest.mocked(useGetContractsMeActive).mockReturnValue(successOf([ACTIVE_CONTRACT]) as never);
        jest.mocked(useGetContractsMePendingResolution).mockReturnValue(successOf([]) as never);

        render(<DashboardScreen />);
        const banner = screen.getByTestId('alert-banner-notif-1');
        expect(banner).toBeTruthy();
        expect(screen.getByText(/ALEX UPLOADED PROOF/)).toBeTruthy();

        fireEvent.press(banner);
        expect(mockPush).toHaveBeenCalledWith('/contract/contract-1/3/evidence/evidence-1');
    });

    it('shows a generic review CTA for a contract with more than one opponent', () => {
        jest.mocked(useGetNotifications).mockReturnValue(successOf([]) as never);
        jest.mocked(useGetContractsMeActive).mockReturnValue(successOf([SQUAD_CONTRACT]) as never);
        jest.mocked(useGetContractsMePendingResolution).mockReturnValue(successOf([]) as never);

        render(<DashboardScreen />);
        expect(screen.getByText('REVIEW PROOF')).toBeTruthy();
        expect(screen.queryByText(/REVIEW SARAH'S PROOF/)).toBeNull();
    });

    it('shows the active contract count badge and pending-resolution section', () => {
        jest.mocked(useGetNotifications).mockReturnValue(successOf([]) as never);
        jest.mocked(useGetContractsMeActive).mockReturnValue(successOf([ACTIVE_CONTRACT]) as never);
        jest.mocked(useGetContractsMePendingResolution).mockReturnValue(
            successOf([PENDING_CONTRACT]) as never
        );

        render(<DashboardScreen />);
        expect(screen.getByText('1 LIVE')).toBeTruthy();
        expect(screen.getByTestId('pending-resolution')).toBeTruthy();
        expect(screen.getByText('Morning Run')).toBeTruthy();
    });

    it('creates a contract and navigates to its build screen on FAB press', async () => {
        jest.mocked(useGetNotifications).mockReturnValue(successOf([]) as never);
        jest.mocked(useGetContractsMeActive).mockReturnValue(successOf([ACTIVE_CONTRACT]) as never);
        jest.mocked(useGetContractsMePendingResolution).mockReturnValue(successOf([]) as never);
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
        jest.mocked(useGetNotifications).mockReturnValue(successOf([]) as never);
        jest.mocked(useGetContractsMeActive).mockReturnValue(successOf([ACTIVE_CONTRACT]) as never);
        jest.mocked(useGetContractsMePendingResolution).mockReturnValue(successOf([]) as never);
        mockMutateAsync.mockRejectedValue(new Error('network error'));

        render(<DashboardScreen />);
        fireEvent.press(screen.getByTestId('fab'));

        await waitFor(() => {
            expect(screen.getByTestId('fab-error')).toBeTruthy();
        });
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('shows an error message when a query fails', () => {
        jest.mocked(useGetNotifications).mockReturnValue(successOf([]) as never);
        jest.mocked(useGetContractsMeActive).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as never);
        jest.mocked(useGetContractsMePendingResolution).mockReturnValue(successOf([]) as never);

        render(<DashboardScreen />);
        expect(screen.getByText(/Couldn't load your dashboard/)).toBeTruthy();
    });
});
