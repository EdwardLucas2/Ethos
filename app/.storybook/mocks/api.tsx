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
// Storybook itself never sees the real file. Fixture data (which has no real
// counterpart) is kept unexported here and duplicated locally in story files
// instead, same as the RNTL pattern in (tabs)/__tests__/dashboard.test.tsx.
import { fn } from 'storybook/test';

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

const mockCreateContractMutateAsync = fn()
    .mockName('createContract.mutateAsync')
    .mockResolvedValue({ data: { id: 'new-contract' }, status: 201 });

export const usePostContracts = fn()
    .mockName('usePostContracts')
    .mockReturnValue({ mutateAsync: mockCreateContractMutateAsync, isPending: false });
