import { CtaState } from '@/components/active-contract-card';
import { ActiveContractResponse, ActiveParticipantResponse } from '@/src/api';
import { Href } from 'expo-router';

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

export function formatTimeRemaining(dateString: string | undefined): string {
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

export function myParticipant(
    participants: ActiveParticipantResponse[] | undefined,
    currentUserId: string | undefined
): ActiveParticipantResponse | undefined {
    return participants?.find((p) => p.userId === currentUserId);
}

export function opponentLabel(
    participants: ActiveParticipantResponse[] | undefined,
    currentUserId: string | undefined
): string {
    const opponents = opponentsOf(participants, currentUserId);
    if (opponents.length === 0) return 'SOLO';
    if (opponents.length === 1) return `VS ${(opponents[0]?.displayName ?? '').toUpperCase()}`;
    return 'SQUAD BATTLE';
}

function evidenceReviewCta(
    contract: ActiveContractResponse,
    currentUserId: string | undefined
): { state: CtaState; label: string } | null {
    if ((contract.unreviewedEvidenceCount ?? 0) === 0) return null;
    const opponents = opponentsOf(contract.participants, currentUserId);
    const label =
        opponents.length === 1
            ? `REVIEW ${(opponents[0]?.displayName ?? 'PROOF').toUpperCase()}'S PROOF`
            : 'REVIEW PROOF';
    return { state: 'review', label };
}

function myCompletion(
    participants: ActiveParticipantResponse[] | undefined,
    currentUserId: string | undefined
): { completed: number; total: number } {
    const mine = myParticipant(participants, currentUserId);
    return { completed: mine?.completed ?? 0, total: mine?.total ?? 0 };
}

function progressCta(
    contract: ActiveContractResponse,
    currentUserId: string | undefined
): { state: CtaState; label: string } {
    const { completed, total } = myCompletion(contract.participants, currentUserId);
    if (completed >= total) return { state: 'caught-up', label: 'ALL CAUGHT UP' };
    return {
        state: daysUntil(contract.endDate) <= 1 ? 'snap-urgent' : 'snap',
        label: 'SNAP PROOF',
    };
}

export function ctaFor(
    contract: ActiveContractResponse,
    currentUserId: string | undefined
): { state: CtaState; label: string } {
    return evidenceReviewCta(contract, currentUserId) ?? progressCta(contract, currentUserId);
}

// A contract's detail routes all share this shape — collects the repeated
// `/contract/${id}/${cycle}/...` template into one place.
export function contractPath(
    contract: { contractId: string; cycleNumber: number },
    segment: string
): Href {
    return `/contract/${contract.contractId}/${contract.cycleNumber}/${segment}` as Href;
}
