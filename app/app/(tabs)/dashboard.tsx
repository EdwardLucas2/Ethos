import { ActiveContractCard, CtaState } from '@/components/active-contract-card';
import { AlertBanner, AlertBannerType } from '@/components/alert-banner';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { EmptyState } from '@/components/empty-state';
import { FAB } from '@/components/fab';
import { PendingResolutionCard } from '@/components/pending-resolution-card';
import { TopBar } from '@/components/top-bar';
import {
    ActiveContractResponse,
    ActiveParticipantResponse,
    ContractResponse,
    NotificationResponse,
    PendingResolutionContractResponse,
    UserResponse,
    useGetContractsMeActive,
    useGetContractsMePendingResolution,
    useGetNotifications,
    useGetUsersMe,
    usePostContracts,
} from '@/src/api';
import { unwrapData } from '@/src/api/unwrap';
import { Href, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { styles } from './dashboard.styles';

// ─── Notification → alert mapping ──────────────────────────────────────────
// Ordered by urgency per docs/API.md: verify, challenge, settle, owed, pay-up.

type AlertEntry = {
    key: string;
    type: AlertBannerType;
    message: string;
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
                message: `${n.submitterName ?? 'Someone'} uploaded proof. [VERIFY]`,
                href: `/contract/${n.contractId}/${n.cycleNumber}/evidence/${n.evidenceId}` as Href,
                priority: 1,
            };
        case 'contract_invited':
            if (!n.contractId) return null;
            return {
                key: n.id ?? `${n.type}-${n.contractId}`,
                type: 'challenge',
                message: `${n.inviterName ?? 'Someone'} challenged you. [VIEW]`,
                href: `/contract/${n.contractId}/join` as Href,
                priority: 2,
            };
        case 'cycle_pending_resolution':
            if (!n.contractId || n.cycleNumber === undefined) return null;
            return {
                key: n.id ?? `${n.type}-${n.contractId}`,
                type: 'settle',
                message: "Last week's results are in. [SETTLE]",
                href: `/contract/${n.contractId}/${n.cycleNumber}/unsettled` as Href,
                priority: 3,
            };
        case 'resolution_winner':
            if (!n.resolutionId) return null;
            return {
                key: n.id ?? `${n.type}-${n.resolutionId}`,
                type: 'owed',
                message: `${n.loserNames?.[0] ?? 'Someone'} owes you. [COLLECT]`,
                href: `/owed/${n.resolutionId}` as Href,
                priority: 4,
            };
        case 'resolution_loser':
            if (!n.resolutionId) return null;
            return {
                key: n.id ?? `${n.type}-${n.resolutionId}`,
                type: 'pay-up',
                message: `You owe ${n.winnerNames?.[0] ?? 'someone'}. [PAY UP]`,
                href: `/pay-up/${n.resolutionId}` as Href,
                priority: 5,
            };
        case 'pester':
            if (!n.resolutionId) return null;
            return {
                key: n.id ?? `${n.type}-${n.resolutionId}`,
                type: 'pay-up',
                message: `${n.fromName ?? 'Someone'} is waiting. [PAY UP]`,
                href: `/pay-up/${n.resolutionId}` as Href,
                priority: 5,
            };
        default:
            return null;
    }
}

// ─── Active contract card derivation ───────────────────────────────────────

function daysUntil(dateString: string | undefined): number {
    if (!dateString) return 0;
    const end = new Date(`${dateString}T00:00:00`);
    const diffMs = end.getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function formatTimeRemaining(dateString: string | undefined): string {
    const days = daysUntil(dateString);
    if (days <= 0) return 'ENDS TODAY';
    if (days === 1) return '1 DAY LEFT';
    return `${days} DAYS LEFT`;
}

function opponentsOf(
    participants: ActiveParticipantResponse[] | undefined,
    myName: string | undefined
): ActiveParticipantResponse[] {
    return (participants ?? []).filter((p) => p.displayName !== myName);
}

function opponentLabel(
    participants: ActiveParticipantResponse[] | undefined,
    myName: string | undefined
): string {
    const opponents = opponentsOf(participants, myName);
    if (opponents.length === 1) return `VS ${(opponents[0]?.displayName ?? '').toUpperCase()}`;
    return 'SQUAD BATTLE';
}

function ctaFor(
    contract: ActiveContractResponse,
    myName: string | undefined
): { state: CtaState; label: string } {
    if ((contract.unreviewedEvidenceCount ?? 0) > 0) {
        const opponent = opponentsOf(contract.participants, myName)[0];
        return {
            state: 'review',
            label: `REVIEW ${(opponent?.displayName ?? 'PROOF').toUpperCase()}'S PROOF`,
        };
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

    const { data: meResponse } = useGetUsersMe();
    const me = unwrapData<UserResponse>(meResponse);

    const { data: notificationsResponse, isLoading: notificationsLoading } = useGetNotifications();
    const notifications = unwrapData<NotificationResponse[]>(notificationsResponse);

    const {
        data: activeResponse,
        isLoading: activeLoading,
        isError: activeError,
    } = useGetContractsMeActive();
    const activeContracts = unwrapData<ActiveContractResponse[]>(activeResponse);

    const {
        data: pendingResponse,
        isLoading: pendingLoading,
        isError: pendingError,
    } = useGetContractsMePendingResolution();
    const pendingContracts = unwrapData<PendingResolutionContractResponse[]>(pendingResponse);

    const createContract = usePostContracts();

    async function handleFabPress() {
        const result = await createContract.mutateAsync();
        const contract = unwrapData<ContractResponse>(result);
        if (contract?.id) {
            // Contract Builder isn't built yet — see product/PRD.md §5.4.
            router.push(`/contract/${contract.id}/build` as Href);
        }
    }

    const isLoading = notificationsLoading || activeLoading || pendingLoading;
    const isError = activeError || pendingError;
    const isEmpty =
        !isLoading && (activeContracts?.length ?? 0) === 0 && (pendingContracts?.length ?? 0) === 0;

    const alerts = (notifications ?? [])
        .map(toAlertEntry)
        .filter((entry): entry is AlertEntry => entry !== null)
        .sort((a, b) => a.priority - b.priority);

    return (
        <View style={styles.flex}>
            <TopBar variant="tab" avatarUri={me?.avatarUrl} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {isLoading ? (
                    <View style={styles.skeletonStack} testID="dashboard-skeleton">
                        <View style={styles.skeletonBlock} />
                        <View style={styles.skeletonBlock} />
                        <View style={styles.skeletonBlock} />
                    </View>
                ) : isError ? (
                    <View style={styles.centered}>
                        <Text style={styles.errorText}>
                            Couldn&apos;t load your dashboard. Try again later.
                        </Text>
                    </View>
                ) : isEmpty ? (
                    <EmptyState
                        message="No active contracts. Challenge your friends!"
                        ctaLabel="Create a Contract"
                        onCta={handleFabPress}
                    />
                ) : (
                    <>
                        {alerts.length > 0 && (
                            <View style={styles.alertStack} testID="alert-stack">
                                {alerts.map((alert) => (
                                    <AlertBanner
                                        key={alert.key}
                                        type={alert.type}
                                        message={alert.message}
                                        onPress={() => router.push(alert.href)}
                                    />
                                ))}
                            </View>
                        )}

                        {(activeContracts?.length ?? 0) > 0 && (
                            <View style={styles.section} testID="active-arena">
                                <View style={styles.sectionHeaderRow}>
                                    <Text style={styles.sectionHeader}>Active Arena</Text>
                                    <View style={styles.countBadge}>
                                        <Text style={styles.countBadgeText}>
                                            {activeContracts?.length} LIVE
                                        </Text>
                                    </View>
                                </View>
                                {activeContracts?.map((contract) => {
                                    const cta = ctaFor(contract, me?.displayName);
                                    return (
                                        <ActiveContractCard
                                            key={contract.contractId}
                                            contractName={contract.name ?? ''}
                                            opponentLabel={opponentLabel(
                                                contract.participants,
                                                me?.displayName
                                            )}
                                            verified={contract.myProgress?.completed ?? 0}
                                            pending={contract.myProgress?.pending ?? 0}
                                            total={contract.myProgress?.total ?? 0}
                                            timeRemaining={formatTimeRemaining(contract.endDate)}
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

                        {(pendingContracts?.length ?? 0) > 0 && (
                            <View style={styles.section} testID="pending-resolution">
                                <View style={styles.sectionHeaderRow}>
                                    <Text style={styles.sectionHeader}>Last Week</Text>
                                </View>
                                {pendingContracts?.map((contract) => {
                                    const mine = contract.participants?.find(
                                        (p) => p.displayName === me?.displayName
                                    );
                                    return (
                                        <PendingResolutionCard
                                            key={contract.contractId}
                                            contractName={contract.contractName ?? ''}
                                            verified={mine?.completed ?? 0}
                                            total={mine?.total ?? 0}
                                            reviewsNeeded={contract.unreviewedEvidenceCount ?? 0}
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
            {!isEmpty && <FAB onPress={handleFabPress} loading={createContract.isPending} />}
            <BottomTabBar activeTab="home" />
        </View>
    );
}
