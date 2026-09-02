// Canonical dashboard fixture data, shared by .storybook/mocks/api.tsx and
// dashboard.stories.tsx. Deliberately has no `@/src/api` import — tsc
// resolves `@/src/api` against the real Orval module even from files
// Storybook itself never sees (see mocks/api.tsx), so a plain, unaliased
// module is what lets both consumers share one copy instead of two
// independently-drifting literal copies. dashboard.test.tsx only imports
// `ME` from here — its contract/notification fixtures are intentionally
// local (far-future dates keep CTA-state assertions stable regardless of
// when the suite runs; these near-term dates are for Storybook's "today"
// framing).

export const ME = {
    id: 'user-1',
    displayName: 'Edward',
    tag: 'edward1',
    email: 'e@e.com',
    avatarUrl: null,
};

export const ACTIVE_CONTRACTS = [
    {
        contractId: 'contract-1',
        name: 'Gym 3x/Week',
        cycleNumber: 3,
        startDate: '2026-08-29',
        endDate: '2026-09-05',
        myProgress: { completed: 2, pending: 0, total: 3 },
        unreviewedEvidenceCount: 0,
        participants: [
            {
                userId: 'user-1',
                displayName: 'Edward',
                avatarUrl: null,
                completed: 2,
                pending: 0,
                total: 3,
                isSelf: true,
            },
            {
                userId: 'user-2',
                displayName: 'Alex',
                avatarUrl: null,
                completed: 1,
                pending: 1,
                total: 3,
                isSelf: false,
            },
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
            {
                userId: 'user-1',
                displayName: 'Edward',
                avatarUrl: null,
                completed: 0,
                pending: 0,
                total: 1,
                isSelf: true,
            },
            {
                userId: 'user-3',
                displayName: 'Sarah',
                avatarUrl: null,
                completed: 1,
                pending: 0,
                total: 1,
                isSelf: false,
            },
            {
                userId: 'user-4',
                displayName: 'Mike',
                avatarUrl: null,
                completed: 1,
                pending: 0,
                total: 1,
                isSelf: false,
            },
        ],
    },
];

export const PENDING_CONTRACTS = [
    {
        contractId: 'contract-3',
        contractName: 'Morning Run',
        cycleNumber: 2,
        unreviewedEvidenceCount: 3,
        participants: [
            { userId: 'user-1', displayName: 'Edward', completed: 3, total: 3, isSelf: true },
            { userId: 'user-2', displayName: 'Alex', completed: 1, total: 3, isSelf: false },
        ],
    },
];

export const NOTIFICATIONS = [
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
