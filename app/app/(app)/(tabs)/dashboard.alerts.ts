import { AlertBannerType } from '@/components/alert-banner';
import {
    ContractInvitedNotification,
    CyclePendingResolutionNotification,
    EvidenceUploadedNotification,
    NotificationResponse,
    PesterNotification,
    ResolutionLoserNotification,
    ResolutionWinnerNotification,
} from '@/src/api';
import { Href } from 'expo-router';

// ─── Notification → alert mapping ──────────────────────────────────────────
// Ordered by urgency per docs/API.md: verify, challenge, settle, owed, pay-up.

export type AlertEntry = {
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

export function toAlertEntry(n: NotificationResponse): AlertEntry | null {
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
