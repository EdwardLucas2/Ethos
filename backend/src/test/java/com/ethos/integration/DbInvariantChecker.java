package com.ethos.integration;

import java.util.ArrayList;
import java.util.List;
import org.jdbi.v3.core.Jdbi;
import org.junit.jupiter.api.Assertions;

/**
 * Runs read-only database assertions that verify service-level invariants which cannot be enforced
 * by DB constraints alone. Call {@link #assertAll} at the end of a logical flow integration test.
 *
 * <p>Each check returns a list of human-readable violation strings. {@link #assertAll} collects all
 * violations across every check and fails with a single consolidated report if any are found.
 */
public final class DbInvariantChecker {

    private final Jdbi jdbi;

    public DbInvariantChecker(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    /**
     * Runs all invariant checks and fails the test if any violations are found. The {@code context}
     * string is included in the failure message to identify which test scenario was running.
     */
    public void assertAll(String context) {
        var violations = new ArrayList<String>();
        violations.addAll(checkHabitActionCounts());
        violations.addAll(checkNoActionsForNonSignedParticipants());
        violations.addAll(checkOneEvidencePerHabitAction());
        violations.addAll(checkVotersInSameContract());
        violations.addAll(checkSettledCyclesHaveResolution());
        violations.addAll(checkNoResolutionForUnsettledCycles());
        violations.addAll(checkAcknowledgmentUsersInResolution());
        violations.addAll(checkPestersAreWinnerToLoser());
        violations.addAll(checkNoCycleNumberGaps());

        if (!violations.isEmpty()) {
            Assertions.fail("Data invariant violations [" + context + "]:\n  - "
                    + String.join("\n  - ", violations));
        }
    }

    /**
     * For every (cycle, participant) pair in habit_actions, the row count must equal
     * participants.frequency. Catches over- or under-creation during cycle start.
     */
    private List<String> checkHabitActionCounts() {
        return jdbi.withHandle(h -> h.createQuery("""
                        SELECT ha.cycle_id, ha.participant_id, p.frequency, COUNT(*) AS actual
                        FROM habit_actions ha
                        JOIN participants p ON p.id = ha.participant_id
                        GROUP BY ha.cycle_id, ha.participant_id, p.frequency
                        HAVING COUNT(*) != p.frequency
                        """)
                .mapToMap()
                .list()
                .stream()
                .map(row -> "habit_actions count mismatch: participant=%s cycle=%s expected=%s actual=%s"
                        .formatted(row.get("participant_id"), row.get("cycle_id"),
                                row.get("frequency"), row.get("actual")))
                .toList());
    }

    /**
     * Participants with sign_status 'declined' or 'removed' must have no habit_actions rows.
     * Active participant queries must filter these statuses; this catches missing filters.
     */
    private List<String> checkNoActionsForNonSignedParticipants() {
        return jdbi.withHandle(h -> h.createQuery("""
                        SELECT DISTINCT ha.participant_id, p.sign_status
                        FROM habit_actions ha
                        JOIN participants p ON p.id = ha.participant_id
                        WHERE p.sign_status IN ('declined', 'removed')
                        """)
                .mapToMap()
                .list()
                .stream()
                .map(row -> "habit_actions exist for %s participant: participant=%s"
                        .formatted(row.get("sign_status"), row.get("participant_id")))
                .toList());
    }

    /**
     * At most one evidence row may exist per habit_action. Enforced at the service layer — no DB
     * unique constraint. A second submission must be rejected, not inserted.
     */
    private List<String> checkOneEvidencePerHabitAction() {
        return jdbi.withHandle(h -> h.createQuery("""
                        SELECT habit_action_id, COUNT(*) AS evidence_count
                        FROM evidence
                        GROUP BY habit_action_id
                        HAVING COUNT(*) > 1
                        """)
                .mapToMap()
                .list()
                .stream()
                .map(row -> "multiple evidence rows: habit_action=%s count=%s"
                        .formatted(row.get("habit_action_id"), row.get("evidence_count")))
                .toList());
    }

    /**
     * A vote's voter_participant_id must belong to the same contract as the evidence being voted
     * on. The FK to participants prevents non-participants from voting but does not enforce
     * cross-contract membership.
     */
    private List<String> checkVotersInSameContract() {
        return jdbi.withHandle(h -> h.createQuery("""
                        SELECT DISTINCT v.id AS vote_id, v.voter_participant_id, e.id AS evidence_id
                        FROM votes v
                        JOIN evidence e ON e.id = v.evidence_id
                        JOIN habit_actions ha ON ha.id = e.habit_action_id
                        JOIN cycles cy ON cy.id = ha.cycle_id
                        JOIN participants voter_p ON voter_p.id = v.voter_participant_id
                        WHERE cy.contract_id != voter_p.contract_id
                        """)
                .mapToMap()
                .list()
                .stream()
                .map(row -> "voter from different contract: vote=%s voter_participant=%s evidence=%s"
                        .formatted(row.get("vote_id"), row.get("voter_participant_id"),
                                row.get("evidence_id")))
                .toList());
    }

    /**
     * Every cycle with status 'settled' must have exactly one cycle_resolutions row. The UNIQUE
     * constraint prevents duplicates but not absence.
     */
    private List<String> checkSettledCyclesHaveResolution() {
        return jdbi.withHandle(h -> h.createQuery("""
                        SELECT cy.id AS cycle_id
                        FROM cycles cy
                        LEFT JOIN cycle_resolutions cr ON cr.cycle_id = cy.id
                        WHERE cy.status = 'settled' AND cr.id IS NULL
                        """)
                .mapToMap()
                .list()
                .stream()
                .map(row -> "settled cycle missing resolution: cycle=%s".formatted(row.get("cycle_id")))
                .toList());
    }

    /**
     * A cycle_resolutions row must only exist for a cycle with status 'settled'. Catches the
     * resolution service writing a row before the cycle status transition completes.
     */
    private List<String> checkNoResolutionForUnsettledCycles() {
        return jdbi.withHandle(h -> h.createQuery("""
                        SELECT cr.id AS resolution_id, cr.cycle_id, cy.status
                        FROM cycle_resolutions cr
                        JOIN cycles cy ON cy.id = cr.cycle_id
                        WHERE cy.status != 'settled'
                        """)
                .mapToMap()
                .list()
                .stream()
                .map(row -> "resolution exists for unsettled cycle: resolution=%s cycle=%s status=%s"
                        .formatted(row.get("resolution_id"), row.get("cycle_id"), row.get("status")))
                .toList());
    }

    /**
     * Every resolution_acknowledgments.user_id must appear in winner_ids or loser_ids on the
     * linked resolution. No FK enforces this — membership is stored as a UUID array.
     */
    private List<String> checkAcknowledgmentUsersInResolution() {
        return jdbi.withHandle(h -> h.createQuery("""
                        SELECT ra.id, ra.resolution_id, ra.user_id
                        FROM resolution_acknowledgments ra
                        JOIN cycle_resolutions cr ON cr.id = ra.resolution_id
                        WHERE NOT (ra.user_id = ANY(cr.winner_ids) OR ra.user_id = ANY(cr.loser_ids))
                        """)
                .mapToMap()
                .list()
                .stream()
                .map(row -> "acknowledgment user not in resolution: ack=%s resolution=%s user=%s"
                        .formatted(row.get("id"), row.get("resolution_id"), row.get("user_id")))
                .toList());
    }

    /**
     * A pester's from_user_id must be in winner_ids and to_user_id must be in loser_ids on the
     * linked resolution. Only winners can pester and only losers can be pestered.
     */
    private List<String> checkPestersAreWinnerToLoser() {
        return jdbi.withHandle(h -> h.createQuery("""
                        SELECT pe.id AS pester_id, pe.from_user_id, pe.to_user_id, pe.resolution_id
                        FROM pesters pe
                        JOIN cycle_resolutions cr ON cr.id = pe.resolution_id
                        WHERE NOT (pe.from_user_id = ANY(cr.winner_ids)
                            AND pe.to_user_id = ANY(cr.loser_ids))
                        """)
                .mapToMap()
                .list()
                .stream()
                .map(row -> "invalid pester (sender not winner or recipient not loser):"
                        + " pester=%s resolution=%s".formatted(row.get("pester_id"),
                                row.get("resolution_id")))
                .toList());
    }

    /**
     * Cycle numbers within a contract must be sequential with no gaps: MAX(cycle_number) must equal
     * COUNT(*). A gap means the scheduler skipped or deleted a cycle.
     */
    private List<String> checkNoCycleNumberGaps() {
        return jdbi.withHandle(h -> h.createQuery("""
                        SELECT contract_id, MAX(cycle_number) AS max_num, COUNT(*) AS total
                        FROM cycles
                        GROUP BY contract_id
                        HAVING MAX(cycle_number) != COUNT(*)
                        """)
                .mapToMap()
                .list()
                .stream()
                .map(row -> "cycle number gap: contract=%s max_cycle_number=%s total_cycles=%s"
                        .formatted(row.get("contract_id"), row.get("max_num"), row.get("total")))
                .toList());
    }
}
