import { ActiveContractCard, CtaState } from '@/components/active-contract-card';
import { AlertBanner, AlertBannerType } from '@/components/alert-banner';
import { AlertMessage } from '@/components/alert-message';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { EmptyState } from '@/components/empty-state';
import { FAB } from '@/components/fab';
import { PendingResolutionCard } from '@/components/pending-resolution-card';
import { TopBar } from '@/components/top-bar';
import {
    ActiveContractResponse,
    ActiveParticipantResponse,
    NotificationResponse,
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

function toAlertEntry(n: NotificationResponse): AlertEntry | null {
    switch (n.type) {
        case 'evidence_uploaded':
            if (!n.contractId || n.cycleNumber === undefined || !n.evidenceId) return null;
            return {
                key: n.id ?? `${n.type}-${n.evidenceId}`,
                type: 'verify',
                message: `${n.submitterName ?? 'Someone'} uploaded proof.`,
                actionLabel: 'Verify',
                href: `/contract/${n.contractId}/${n.cycleNumber}/evidence/${n.evidenceId}` as Href,
                priority: 1,
            };
        case 'contract_invited':
            if (!n.contractId) return null;
            return {
                key: n.id ?? `${n.type}-${n.contractId}`,
                type: 'challenge',
                message: `${n.inviterName ?? 'Someone'} challenged you.`,
                actionLabel: 'View',
                href: `/contract/${n.contractId}/join` as Href,
                priority: 2,
            };
        case 'cycle_pending_resolution':
            if (!n.contractId || n.cycleNumber === undefined) return null;
            return {
                key: n.id ?? `${n.type}-${n.contractId}`,
                type: 'settle',
                message: "Last week's results are in.",
                actionLabel: 'Settle',
                href: `/contract/${n.contractId}/${n.cycleNumber}/unsettled` as Href,
                priority: 3,
            };
        case 'resolution_winner':
            if (!n.resolutionId) return null;
            return {
                key: n.id ?? `${n.type}-${n.resolutionId}`,
                type: 'owed',
                message: `${n.loserNames?.[0] ?? 'Someone'} owes you.`,
                actionLabel: 'Collect',
                href: `/owed/${n.resolutionId}` as Href,
                priority: 4,
            };
        case 'resolution_loser':
        case 'pester':
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
        default:
            return null;
    }
}

// ─── Active contract card derivation ───────────────────────────────────────

export function daysUntil(dateString: string | undefined): number {
    if (!dateString) return 0;
    const [year, month, day] = dateString.split('-').map(Number);
    const end = new Date(year!, month! - 1, day!);
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
    participants: ActiveParticipantResponse[] | undefined
): ActiveParticipantResponse[] {
    return (participants ?? []).filter((p) => !p.isSelf);
}

function opponentLabel(participants: ActiveParticipantResponse[] | undefined): string {
    const opponents = opponentsOf(participants);
    if (opponents.length === 0) return 'SOLO';
    if (opponents.length === 1) return `VS ${(opponents[0]?.displayName ?? '').toUpperCase()}`;
    return 'SQUAD BATTLE';
}

function ctaFor(contract: ActiveContractResponse): { state: CtaState; label: string } {
    if ((contract.unreviewedEvidenceCount ?? 0) > 0) {
        const opponents = opponentsOf(contract.participants);
        const label =
            opponents.length === 1
                ? `REVIEW ${(opponents[0]?.displayName ?? 'PROOF').toUpperCase()}'S PROOF`
                : 'REVIEW PROOF';
        return { state: 'review', label };
    }
    const completed = contract.myProgress?.completed ?? 0;
    const total = contract.myProgress?.total ?? 0;
    if (completed < total) {
        return {
            state: daysUntil(contract.endDate) <= 1 ? 'snap-urgent' : 'snap',
            label: 'SNAP PROOF',
        };
    }
    return { state: 'caught-up', label: 'ALL CAUGHT UP' };
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { session, isLoading: authLoading } = useAuth();
    const enabled = !authLoading && !!session;

    const { data: me, isLoading: meLoading, isError: meError } = useCurrentUser();

    const {
        data: notifications,
        isLoading: notificationsLoading,
        isError: notificationsError,
    } = useGetNotifications({ query: { enabled } });

    const {
        data: activeContracts,
        isLoading: activeLoading,
        isError: activeError,
    } = useGetContractsMeActive({ query: { enabled } });

    const {
        data: pendingContracts,
        isLoading: pendingLoading,
        isError: pendingError,
    } = useGetContractsMePendingResolution({ query: { enabled } });

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
        } catch {
            setFabError("Couldn't create a contract. Try again.");
        }
    }

    const isLoading = notificationsLoading || activeLoading || pendingLoading || meLoading;
    const isError = activeError || pendingError || meError || notificationsError;

    const alerts = useMemo(
        () =>
            (notifications ?? [])
                .map(toAlertEntry)
                .filter((entry): entry is AlertEntry => entry !== null)
                .sort((a, b) => a.priority - b.priority),
        [notifications]
    );

    const activeCount = activeContracts?.length ?? 0;
    const pendingCount = pendingContracts?.length ?? 0;
    const isEmpty = !isLoading && activeCount === 0 && pendingCount === 0 && alerts.length === 0;

    return (
        <View style={styles.flex}>
            <TopBar variant="tab" avatarUri={me?.avatarUrl} />
            {fabError && (
                <AlertMessage
                    message={fabError}
                    severity="error"
                    dismissible
                    onDismiss={() => setFabError(null)}
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
                            loading={createContract.isPending}
                        />
                    ) : (
                        <>
                            {alerts.length > 0 && (
                                <View style={styles.alertStack} testID="alert-stack">
                                    {alerts.map((alert) => (
                                        <AlertBanner
                                            key={alert.key}
                                            testID={`alert-banner-${alert.key}`}
                                            type={alert.type}
                                            message={alert.message}
                                            actionLabel={alert.actionLabel}
                                            onPress={() => router.push(alert.href)}
                                        />
                                    ))}
                                </View>
                            )}

                            {activeCount > 0 && (
                                <View style={styles.section} testID="active-arena">
                                    <View style={styles.sectionHeaderRow}>
                                        <Text style={styles.sectionHeader}>Active Arena</Text>
                                        <View style={styles.countBadge}>
                                            <Text style={styles.countBadgeText}>
                                                {activeCount} live
                                            </Text>
                                        </View>
                                    </View>
                                    {activeContracts?.map((contract) => {
                                        const cta = ctaFor(contract);
                                        return (
                                            <ActiveContractCard
                                                key={contract.contractId}
                                                testID={`active-contract-card-${contract.contractId}`}
                                                contractName={contract.name ?? ''}
                                                opponentLabel={opponentLabel(contract.participants)}
                                                verified={contract.myProgress?.completed ?? 0}
                                                pending={contract.myProgress?.pending ?? 0}
                                                total={contract.myProgress?.total ?? 0}
                                                timeRemaining={formatTimeRemaining(
                                                    contract.endDate
                                                )}
                                                ctaState={cta.state}
                                                ctaLabel={cta.label}
                                                onPress={() =>
                                                    router.push(
                                                        `/contract/${contract.contractId}/${contract.cycleNumber}/active` as Href
                                                    )
                                                }
                                                onCta={() =>
                                                    router.push(
                                                        (cta.state === 'review'
                                                            ? `/contract/${contract.contractId}/${contract.cycleNumber}/evidence/review`
                                                            : `/contract/${contract.contractId}/${contract.cycleNumber}/evidence/upload`) as Href
                                                    )
                                                }
                                            />
                                        );
                                    })}
                                </View>
                            )}

                            {pendingCount > 0 && (
                                <View style={styles.section} testID="pending-resolution">
                                    <View style={styles.sectionHeaderRow}>
                                        <Text style={styles.sectionHeader}>Last Week</Text>
                                    </View>
                                    {pendingContracts?.map((contract) => {
                                        const mine = contract.participants?.find(
                                            (p) => p.userId === me?.id
                                        );
                                        return (
                                            <PendingResolutionCard
                                                key={contract.contractId}
                                                testID={`pending-resolution-card-${contract.contractId}`}
                                                contractName={contract.contractName ?? ''}
                                                verified={mine?.completed ?? 0}
                                                total={mine?.total ?? 0}
                                                reviewsNeeded={
                                                    contract.unreviewedEvidenceCount ?? 0
                                                }
                                                onPress={() =>
                                                    router.push(
                                                        `/contract/${contract.contractId}/${contract.cycleNumber}/unsettled` as Href
                                                    )
                                                }
                                            />
                                        );
                                    })}
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>
                {!isLoading && !isEmpty && (
                    <FAB onPress={handleFabPress} loading={createContract.isPending} />
                )}
            </View>
            <BottomTabBar activeTab="home" />
        </View>
    );
}
