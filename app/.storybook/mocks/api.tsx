// Spy replacements for @/src/api (the Orval-generated client).
// Query hooks default to the same populated dummy data the backend's
// ContractService/NotificationService dummy endpoints return, so the Default
// story matches what the app shows against the real (dummy) API. Stories
// override return values via mockReturnValue in `beforeEach`/`play`.
//
// Only names that are real exports of @/src/api are exported here — this
// file is exclusively a Vite alias target (see .storybook/main.ts), but `tsc`
// still resolves `@/src/api` imports in .stories.tsx files against the REAL
// module, so an export with no counterpart there fails typecheck even though
// Storybook itself never sees the real file.
import { fn } from 'storybook/test';
import { ACTIVE_CONTRACTS, ME, NOTIFICATIONS, PENDING_CONTRACTS } from './dashboard-fixtures';

function successOf<T>(data: T) {
    return { data, isLoading: false, isError: false };
}

export const useGetUsersMe = fn().mockName('useGetUsersMe').mockReturnValue(successOf(ME));

export const useGetNotifications = fn()
    .mockName('useGetNotifications')
    .mockReturnValue(successOf(NOTIFICATIONS));

export const useGetContractsMeActive = fn()
    .mockName('useGetContractsMeActive')
    .mockReturnValue(successOf(ACTIVE_CONTRACTS));

export const useGetContractsMePendingResolution = fn()
    .mockName('useGetContractsMePendingResolution')
    .mockReturnValue(successOf(PENDING_CONTRACTS));

export const getGetContractsMeActiveQueryKey = fn()
    .mockName('getGetContractsMeActiveQueryKey')
    .mockReturnValue(['contracts-me-active']);

export const getGetContractsMePendingResolutionQueryKey = fn()
    .mockName('getGetContractsMePendingResolutionQueryKey')
    .mockReturnValue(['contracts-me-pending-resolution']);

export const getGetNotificationsQueryKey = fn()
    .mockName('getGetNotificationsQueryKey')
    .mockReturnValue(['notifications']);

const mockCreateContractMutateAsync = fn()
    .mockName('createContract.mutateAsync')
    .mockResolvedValue({ id: 'new-contract' });

export const usePostContracts = fn()
    .mockName('usePostContracts')
    .mockReturnValue({ mutateAsync: mockCreateContractMutateAsync, isPending: false });
