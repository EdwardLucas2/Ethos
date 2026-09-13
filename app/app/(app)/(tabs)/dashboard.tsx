import { ActiveContractCard, CtaState } from '@/components/active-contract-card';
import { AlertBanner, AlertBannerType } from '@/components/alert-banner';
import { AlertMessage } from '@/components/alert-message';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { EmptyState } from '@/components/empty-state';
import { FAB } from '@/components/fab';
import { PendingResolutionCard } from '@/components/pending-resolution-card';
import { TopBar } from '@/components/top-bar';
import { isApiErrorWithStatus } from '@/src/api/client';
import {
    ActiveContractResponse,
    ActiveParticipantResponse,
    ContractInvitedNotification,
    CyclePendingResolutionNotification,
    EvidenceUploadedNotification,
    NotificationResponse,
    PendingResolutionContractResponse,
    PesterNotification,
    ResolutionLoserNotification,
    ResolutionWinnerNotification,
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
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { styles } from './dashboard.styles';

// ─── Notification → alert mapping ──────────────────────────────────────────
// Ordered by urgency per docs/API.md: verify, challenge, settle, owed, pay-up.

type AlertEntry = {
    key: string;
    type: AlertBannerType;
    message: string;
    actionLabel: string;
    href: Href;
    priority: number;
};

function evidenceUploadedAlert(n: EvidenceUploadedNotification): AlertEntry | null {
    if (!n.contractId || !n.evidenceId) return null;
    return {
        key: n.id ?? `${n.type}-${n.evidenceId}`,
        type: 'verify',
        message: `${n.submitterName ?? 'Someone'} uploaded proof.`,
        actionLabel: 'Verify',
        href: `/contract/${n.contractId}/${n.cycleNumber}/evidence/${n.evidenceId}` as Href,
        priority: 1,
    };
}

function contractInvitedAlert(n: ContractInvitedNotification): AlertEntry | null {
    if (!n.contractId) return null;
    return {
        key: n.id ?? `${n.type}-${n.contractId}`,
        type: 'challenge',
        message: `${n.inviterName ?? 'Someone'} challenged you.`,
        actionLabel: 'View',
        href: `/contract/${n.contractId}/join` as Href,
        priority: 2,
    };
}

function cyclePendingResolutionAlert(n: CyclePendingResolutionNotification): AlertEntry | null {
    if (!n.contractId) return null;
    return {
        key: n.id ?? `${n.type}-${n.contractId}`,
        type: 'settle',
        message: "Last week's results are in.",
        actionLabel: 'Settle',
        href: `/contract/${n.contractId}/${n.cycleNumber}/unsettled` as Href,
        priority: 3,
    };
}

function resolutionWinnerAlert(n: ResolutionWinnerNotification): AlertEntry | null {
    if (!n.resolutionId) return null;
    return {
        key: n.id ?? `${n.type}-${n.resolutionId}`,
        type: 'owed',
        message: `${n.loserNames?.[0] ?? 'Someone'} owes you.`,
        actionLabel: 'Collect',
        href: `/owed/${n.resolutionId}` as Href,
        priority: 4,
    };
}

function resolutionLoserOrPesterAlert(
    n: ResolutionLoserNotification | PesterNotification
): AlertEntry | null {
    if (!n.resolutionId) return null;
    return {
        key: n.id ?? `${n.type}-${n.resolutionId}`,
        type: 'pay-up',
        message:
            n.type === 'pester'
                ? `${n.fromName ?? 'Someone'} is waiting.`
                : `You owe ${n.winnerNames?.[0] ?? 'someone'}.`,
        actionLabel: 'Pay Up',
        href: `/pay-up/${n.resolutionId}` as Href,
        priority: 5,
    };
}

function toAlertEntry(n: NotificationResponse): AlertEntry | null {
    switch (n.type) {
        case 'evidence_uploaded':
            return evidenceUploadedAlert(n);
        case 'contract_invited':
            return contractInvitedAlert(n);
        case 'cycle_pending_resolution':
            return cyclePendingResolutionAlert(n);
        case 'resolution_winner':
            return resolutionWinnerAlert(n);
        case 'resolution_loser':
        case 'pester':
            return resolutionLoserOrPesterAlert(n);
    }
}

// ─── Active contract card derivation ───────────────────────────────────────

export function daysUntil(dateString: string | undefined): number {
    if (!dateString) {
        // endDate is a required field on the backend — a contract reaching here
        // without one is a real bug, not routine optionality. Fail safe (treat
        // as not urgent) but don't swallow it silently.
        console.warn('daysUntil: missing endDate on contract — should not happen');
        return 0;
    }
    const [year, month, day] = dateString.split('-').map(Number);
    if (year === undefined || month === undefined || day === undefined) return 0;
    const end = new Date(year, month - 1, day);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatTimeRemaining(dateString: string | undefined): string {
    const days = daysUntil(dateString);
    if (days < 0) return 'OVERDUE';
    if (days === 0) return 'ENDS TODAY';
    if (days === 1) return '1 DAY LEFT';
    return `${days} DAYS LEFT`;
}

function opponentsOf(
    participants: ActiveParticipantResponse[] | undefined,
    currentUserId: string | undefined
): ActiveParticipantResponse[] {
    return (participants ?? []).filter((p) => p.userId !== currentUserId);
}

function myParticipant(
    participants: ActiveParticipantResponse[] | undefined,
    currentUserId: string | undefined
): ActiveParticipantResponse | undefined {
    return participants?.find((p) => p.userId === currentUserId);
}

function opponentLabel(
    participants: ActiveParticipantResponse[] | undefined,
    currentUserId: string | undefined
): string {
    const opponents = opponentsOf(participants, currentUserId);
    if (opponents.length === 0) return 'SOLO';
    if (opponents.length === 1) return `VS ${(opponents[0]?.displayName ?? '').toUpperCase()}`;
    return 'SQUAD BATTLE';
}

function ctaFor(
    contract: ActiveContractResponse,
    currentUserId: string | undefined
): { state: CtaState; label: string } {
    if ((contract.unreviewedEvidenceCount ?? 0) > 0) {
        const opponents = opponentsOf(contract.participants, currentUserId);
        const label =
            opponents.length === 1
                ? `REVIEW ${(opponents[0]?.displayName ?? 'PROOF').toUpperCase()}'S PROOF`
                : 'REVIEW PROOF';
        return { state: 'review', label };
    }
    const mine = myParticipant(contract.participants, currentUserId);
    const completed = mine?.completed ?? 0;
    const total = mine?.total ?? 0;
    if (completed < total) {
        return {
            state: daysUntil(contract.endDate) <= 1 ? 'snap-urgent' : 'snap',
            label: 'SNAP PROOF',
        };
    }
    return { state: 'caught-up', label: 'ALL CAUGHT UP' };
}

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

function useDashboardData() {
    const { me, notifications, activeContracts, pendingContracts, isLoading, isError } =
        useDashboardQueries();
    const alerts = useAlerts(notifications);

    const activeCount = activeContracts?.length ?? 0;
    const pendingCount = pendingContracts?.length ?? 0;
    const isEmpty = !isLoading && activeCount === 0 && pendingCount === 0 && alerts.length === 0;

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
            {contracts?.map((contract) => {
                const cta = ctaFor(contract, currentUserId);
                const mine = myParticipant(contract.participants, currentUserId);
                return (
                    <ActiveContractCard
                        key={contract.contractId}
                        testID={`active-contract-card-${contract.contractId}`}
                        contractName={contract.name ?? ''}
                        opponentLabel={opponentLabel(contract.participants, currentUserId)}
                        verified={mine?.completed ?? 0}
                        pending={mine?.pending ?? 0}
                        total={mine?.total ?? 0}
                        timeRemaining={formatTimeRemaining(contract.endDate)}
                        ctaState={cta.state}
                        ctaLabel={cta.label}
                        onPress={() => onOpen(contract)}
                        onCta={() => onCta(contract, cta)}
                    />
                );
            })}
        </View>
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
            {contracts?.map((contract) => {
                const mine = contract.participants?.find((p) => p.userId === currentUserId);
                return (
                    <PendingResolutionCard
                        key={contract.contractId}
                        testID={`pending-resolution-card-${contract.contractId}`}
                        contractName={contract.contractName ?? ''}
                        verified={mine?.completed ?? 0}
                        total={mine?.total ?? 0}
                        reviewsNeeded={contract.unreviewedEvidenceCount ?? 0}
                        onPress={() => onOpen(contract)}
                    />
                );
            })}
        </View>
    );
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
    const router = useRouter();
    const {
        me,
        activeContracts,
        pendingContracts,
        alerts,
        isLoading,
        isError,
        activeCount,
        pendingCount,
        isEmpty,
    } = useDashboardData();
    const { handleFabPress, fabError, clearFabError, isPending } = useCreateContract(router);

    return (
        <View style={styles.flex}>
            <TopBar variant="tab" avatarUri={me?.avatarUrl} />
            {fabError && (
                <AlertMessage
                    message={fabError}
                    severity="error"
                    dismissible
                    onDismiss={clearFabError}
                    testID="fab-error"
                />
            )}
            <View style={styles.content}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {isLoading ? (
                        <View style={styles.skeletonStack} testID="dashboard-skeleton">
                            <View style={styles.skeletonBlock} />
                            <View style={styles.skeletonBlock} />
                            <View style={styles.skeletonBlock} />
                        </View>
                    ) : isError ? (
                        <AlertMessage message="Couldn't load your dashboard. Try again later." />
                    ) : isEmpty ? (
                        <EmptyState
                            message="No active contracts. Challenge your friends!"
                            ctaLabel="Create a Contract"
                            onCta={handleFabPress}
                            loading={isPending}
                        />
                    ) : (
                        <>
                            <AlertStackSection
                                alerts={alerts}
                                onPress={(href) => router.push(href)}
                            />
                            <ActiveArenaSection
                                contracts={activeContracts}
                                count={activeCount}
                                currentUserId={me?.id}
                                onOpen={(contract) =>
                                    router.push(
                                        `/contract/${contract.contractId}/${contract.cycleNumber}/active` as Href
                                    )
                                }
                                onCta={(contract, cta) =>
                                    router.push(
                                        (cta.state === 'review'
                                            ? `/contract/${contract.contractId}/${contract.cycleNumber}/evidence/review`
                                            : `/contract/${contract.contractId}/${contract.cycleNumber}/evidence/upload`) as Href
                                    )
                                }
                            />
                            <PendingResolutionSection
                                contracts={pendingContracts}
                                count={pendingCount}
                                currentUserId={me?.id}
                                onOpen={(contract) =>
                                    router.push(
                                        `/contract/${contract.contractId}/${contract.cycleNumber}/unsettled` as Href
                                    )
                                }
                            />
                        </>
                    )}
                </ScrollView>
                {!isLoading && !isEmpty && <FAB onPress={handleFabPress} loading={isPending} />}
            </View>
            <BottomTabBar activeTab="home" />
        </View>
    );
}
