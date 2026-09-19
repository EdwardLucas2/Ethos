import { ActiveContractCard, CtaState } from '@/components/active-contract-card';
import { AlertBanner } from '@/components/alert-banner';
import { AlertMessage } from '@/components/alert-message';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { EmptyState } from '@/components/empty-state';
import { FAB } from '@/components/fab';
import { PendingResolutionCard } from '@/components/pending-resolution-card';
import { TopBar } from '@/components/top-bar';
import { isApiErrorWithStatus } from '@/src/api/client';
import {
    ActiveContractResponse,
    NotificationResponse,
    PendingResolutionContractResponse,
    getGetContractsMeActiveQueryKey,
    getGetContractsMePendingResolutionQueryKey,
    getGetNotificationsQueryKey,
    useGetContractsMeActive,
    useGetContractsMePendingResolution,
    useGetNotifications,
    usePostContracts,
} from '@/src/api';
import { useAuth } from '@/src/context/AuthContext';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useQueryClient } from '@tanstack/react-query';
import { Href, useRouter } from 'expo-router';
import { cloneElement, ReactElement, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { AlertEntry, toAlertEntry } from './dashboard.alerts';
import {
    contractPath,
    ctaFor,
    formatTimeRemaining,
    myParticipant,
    opponentLabel,
} from './dashboard.helpers';
import { styles } from './dashboard.styles';

export { daysUntil } from './dashboard.helpers';

// ─── Data + mutation hooks ──────────────────────────────────────────────────

function useDashboardQueries() {
    const { session, isLoading: authLoading } = useAuth();
    const enabled = !authLoading && !!session;

    const me = useCurrentUser();
    const notifications = useGetNotifications({ query: { enabled } });
    const activeContracts = useGetContractsMeActive({ query: { enabled } });
    const pendingContracts = useGetContractsMePendingResolution({ query: { enabled } });

    const queries = [me, notifications, activeContracts, pendingContracts];
    return {
        me: me.data,
        notifications: notifications.data,
        activeContracts: activeContracts.data,
        pendingContracts: pendingContracts.data,
        isLoading: queries.some((q) => q.isLoading),
        isError: queries.some((q) => q.isError),
    };
}

function useAlerts(notifications: NotificationResponse[] | undefined) {
    return useMemo(
        () =>
            (notifications ?? [])
                .map(toAlertEntry)
                .filter((entry): entry is AlertEntry => entry !== null)
                .sort((a, b) => a.priority - b.priority),
        [notifications]
    );
}

function isDashboardEmpty(
    isLoading: boolean,
    activeCount: number,
    pendingCount: number,
    alertCount: number
): boolean {
    return !isLoading && activeCount === 0 && pendingCount === 0 && alertCount === 0;
}

function useDashboardData() {
    const { me, notifications, activeContracts, pendingContracts, isLoading, isError } =
        useDashboardQueries();
    const alerts = useAlerts(notifications);

    const activeCount = activeContracts?.length ?? 0;
    const pendingCount = pendingContracts?.length ?? 0;
    const isEmpty = isDashboardEmpty(isLoading, activeCount, pendingCount, alerts.length);

    return {
        me,
        activeContracts,
        pendingContracts,
        alerts,
        isLoading,
        isError,
        activeCount,
        pendingCount,
        isEmpty,
    };
}

function useCreateContract(router: ReturnType<typeof useRouter>) {
    const queryClient = useQueryClient();
    const createContract = usePostContracts();
    const [fabError, setFabError] = useState<string | null>(null);

    async function handleFabPress() {
        setFabError(null);
        try {
            const contract = await createContract.mutateAsync();
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: getGetContractsMeActiveQueryKey() }),
                queryClient.invalidateQueries({
                    queryKey: getGetContractsMePendingResolutionQueryKey(),
                }),
                queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() }),
            ]);
            if (contract?.id) {
                // Contract Builder isn't built yet — see product/PRD.md §5.4.
                router.push(`/contract/${contract.id}/build` as Href);
            }
        } catch (e) {
            // Always log the real error so it's visible in diagnostics, even
            // though the user-facing message stays generic (except for the
            // one case — an expired session — where the message should tell
            // them what to actually do about it).
            console.error('Failed to create contract:', e);
            setFabError(
                isApiErrorWithStatus(e, 401)
                    ? 'Your session has expired — please sign in again.'
                    : "Couldn't create a contract. Try again."
            );
        }
    }

    return {
        handleFabPress,
        fabError,
        clearFabError: () => setFabError(null),
        isPending: createContract.isPending,
    };
}

function useDashboardNavigation(router: ReturnType<typeof useRouter>) {
    return {
        openAlert: (href: Href) => router.push(href),
        openActiveContract: (contract: ActiveContractResponse) =>
            router.push(contractPath(contract, 'active')),
        handleActiveCta: (
            contract: ActiveContractResponse,
            cta: { state: CtaState; label: string }
        ) =>
            router.push(
                contractPath(
                    contract,
                    cta.state === 'review' ? 'evidence/review' : 'evidence/upload'
                )
            ),
        openPendingContract: (contract: PendingResolutionContractResponse) =>
            router.push(contractPath(contract, 'unsettled')),
    };
}

// ─── Sections ───────────────────────────────────────────────────────────────

function AlertStackSection({
    alerts,
    onPress,
}: {
    alerts: AlertEntry[];
    onPress: (href: Href) => void;
}) {
    if (alerts.length === 0) return null;
    return (
        <View style={styles.alertStack} testID="alert-stack">
            {alerts.map((alert) => (
                <AlertBanner
                    key={alert.key}
                    testID={`alert-banner-${alert.key}`}
                    type={alert.type}
                    message={alert.message}
                    actionLabel={alert.actionLabel}
                    onPress={() => onPress(alert.href)}
                />
            ))}
        </View>
    );
}

// Shared key-wiring for a section's list of contract rows — both sections
// below rendered an identical map+key shape here, which Codacy's clone
// detector flagged as duplication once each row was its own component.
// Deliberately not generic: a TS generic type param on this function
// (`<T extends ...>`) makes Lizard's TSX parser lose track of every
// function after it in the file, so callers build the {contractId,
// element} pairs themselves (still fully typed) and this just wires keys.
function ContractRows({ rows }: { rows: { contractId: string; element: ReactElement }[] }) {
    return <>{rows.map(({ contractId, element }) => cloneElement(element, { key: contractId }))}</>;
}

function ActiveContractRow({
    contract,
    currentUserId,
    onOpen,
    onCta,
}: {
    contract: ActiveContractResponse;
    currentUserId: string | undefined;
    onOpen: (contract: ActiveContractResponse) => void;
    onCta: (contract: ActiveContractResponse, cta: { state: CtaState; label: string }) => void;
}) {
    const cta = ctaFor(contract, currentUserId);
    const mine = myParticipant(contract.participants, currentUserId);
    return (
        <ActiveContractCard
            testID={`active-contract-card-${contract.contractId}`}
            contractName={contract.name ?? ''}
            opponentLabel={opponentLabel(contract.participants, currentUserId)}
            progress={{
                verified: mine?.completed ?? 0,
                pending: mine?.pending ?? 0,
                total: mine?.total ?? 0,
            }}
            timeRemaining={formatTimeRemaining(contract.endDate)}
            cta={cta}
            onPress={() => onOpen(contract)}
            onCta={() => onCta(contract, cta)}
        />
    );
}

function ActiveArenaSection({
    contracts,
    count,
    currentUserId,
    onOpen,
    onCta,
}: {
    contracts: ActiveContractResponse[] | undefined;
    count: number;
    currentUserId: string | undefined;
    onOpen: (contract: ActiveContractResponse) => void;
    onCta: (contract: ActiveContractResponse, cta: { state: CtaState; label: string }) => void;
}) {
    if (count === 0) return null;
    return (
        <View style={styles.section} testID="active-arena">
            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>Active Arena</Text>
                <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{count} live</Text>
                </View>
            </View>
            <ContractRows
                rows={(contracts ?? []).map((contract) => ({
                    contractId: contract.contractId,
                    element: (
                        <ActiveContractRow
                            contract={contract}
                            currentUserId={currentUserId}
                            onOpen={onOpen}
                            onCta={onCta}
                        />
                    ),
                }))}
            />
        </View>
    );
}

function PendingResolutionRow({
    contract,
    currentUserId,
    onOpen,
}: {
    contract: PendingResolutionContractResponse;
    currentUserId: string | undefined;
    onOpen: (contract: PendingResolutionContractResponse) => void;
}) {
    const mine = contract.participants?.find((p) => p.userId === currentUserId);
    return (
        <PendingResolutionCard
            testID={`pending-resolution-card-${contract.contractId}`}
            contractName={contract.contractName ?? ''}
            verified={mine?.completed ?? 0}
            total={mine?.total ?? 0}
            reviewsNeeded={contract.unreviewedEvidenceCount ?? 0}
            onPress={() => onOpen(contract)}
        />
    );
}

function PendingResolutionSection({
    contracts,
    count,
    currentUserId,
    onOpen,
}: {
    contracts: PendingResolutionContractResponse[] | undefined;
    count: number;
    currentUserId: string | undefined;
    onOpen: (contract: PendingResolutionContractResponse) => void;
}) {
    if (count === 0) return null;
    return (
        <View style={styles.section} testID="pending-resolution">
            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>Last Week</Text>
            </View>
            <ContractRows
                rows={(contracts ?? []).map((contract) => ({
                    contractId: contract.contractId,
                    element: (
                        <PendingResolutionRow
                            contract={contract}
                            currentUserId={currentUserId}
                            onOpen={onOpen}
                        />
                    ),
                }))}
            />
        </View>
    );
}

function DashboardSkeleton() {
    return (
        <View style={styles.skeletonStack} testID="dashboard-skeleton">
            <View style={styles.skeletonBlock} />
            <View style={styles.skeletonBlock} />
            <View style={styles.skeletonBlock} />
        </View>
    );
}

type DashboardBodyProps = {
    data: ReturnType<typeof useDashboardData>;
    nav: ReturnType<typeof useDashboardNavigation>;
    fab: ReturnType<typeof useCreateContract>;
};

function DashboardBody({ data, nav, fab }: DashboardBodyProps) {
    if (data.isLoading) return <DashboardSkeleton />;
    if (data.isError) {
        return <AlertMessage message="Couldn't load your dashboard. Try again later." />;
    }
    if (data.isEmpty) {
        return (
            <EmptyState
                message="No active contracts. Challenge your friends!"
                ctaLabel="Create a Contract"
                onCta={fab.handleFabPress}
                loading={fab.isPending}
            />
        );
    }
    return (
        <>
            <AlertStackSection alerts={data.alerts} onPress={nav.openAlert} />
            <ActiveArenaSection
                contracts={data.activeContracts}
                count={data.activeCount}
                currentUserId={data.me?.id}
                onOpen={nav.openActiveContract}
                onCta={nav.handleActiveCta}
            />
            <PendingResolutionSection
                contracts={data.pendingContracts}
                count={data.pendingCount}
                currentUserId={data.me?.id}
                onOpen={nav.openPendingContract}
            />
        </>
    );
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
    const router = useRouter();
    const data = useDashboardData();
    const nav = useDashboardNavigation(router);
    const fab = useCreateContract(router);

    return (
        <View style={styles.flex}>
            <TopBar variant="tab" avatarUri={data.me?.avatarUrl} />
            {fab.fabError && (
                <AlertMessage
                    message={fab.fabError}
                    severity="error"
                    dismissible
                    onDismiss={fab.clearFabError}
                    testID="fab-error"
                />
            )}
            <View style={styles.content}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <DashboardBody data={data} nav={nav} fab={fab} />
                </ScrollView>
                {!data.isLoading && !data.isEmpty && (
                    <FAB onPress={fab.handleFabPress} loading={fab.isPending} />
                )}
            </View>
            <BottomTabBar activeTab="home" />
        </View>
    );
}
