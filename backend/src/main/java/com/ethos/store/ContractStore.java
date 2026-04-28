package com.ethos.store;

import com.ethos.exception.ConflictException;
import com.ethos.model.ActiveContractRow;
import com.ethos.model.Contract;
import com.ethos.model.ContractDetail;
import com.ethos.model.Cycle;
import com.ethos.model.Participant;
import com.ethos.model.Period;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.PreparedBatch;

public class ContractStore {

    private final Jdbi jdbi;

    private static final RowMapper<Contract> CONTRACT_MAPPER = (rs, ctx) -> new Contract(
            rs.getObject("id", UUID.class),
            rs.getObject("creator_id", UUID.class),
            rs.getString("name"),
            rs.getString("forfeit"),
            Period.fromValue(rs.getString("period")),
            rs.getObject("start_date", LocalDate.class),
            rs.getString("status"),
            rs.getTimestamp("created_at").toInstant());

    public ContractStore(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    // -----------------------------------------------------------------------
    // Contract methods
    // -----------------------------------------------------------------------

    public ContractDetail insert(UUID creatorId, String name, String forfeit, Period period, LocalDate startDate) {
        return jdbi.inTransaction(handle -> {
            Contract contract = handle.createQuery(
                            """
                            INSERT INTO contracts (creator_id, name, forfeit, period, start_date, status)
                            VALUES (:creatorId, :name, :forfeit, :period, :startDate, 'draft')
                            RETURNING id, creator_id, name, forfeit, period, start_date, status, created_at
                            """)
                    .bind("creatorId", creatorId)
                    .bind("name", name)
                    .bind("forfeit", forfeit)
                    .bind("period", period.name())
                    .bind("startDate", startDate)
                    .map(CONTRACT_MAPPER)
                    .one();

            Participant participant = handle.createQuery(
                            """
                            INSERT INTO participants (contract_id, user_id, sign_status, habit, frequency)
                            VALUES (:contractId, :userId, 'drafting', NULL, NULL)
                            RETURNING id, contract_id, user_id, habit, frequency, sign_status, opted_out_of_next_cycle, invited_at, signed_at
                            """)
                    .bind("contractId", contract.id())
                    .bind("userId", creatorId)
                    .map(ParticipantStore.PARTICIPANT_MAPPER)
                    .one();

            return new ContractDetail(contract, List.of(participant), null);
        });
    }

    public Optional<ContractDetail> findById(UUID contractId) {
        return jdbi.withHandle(handle -> {
            Optional<Contract> contract = handle.createQuery(
                            """
                            SELECT id, creator_id, name, forfeit, period, start_date, status, created_at
                            FROM contracts
                            WHERE id = :contractId
                            """)
                    .bind("contractId", contractId)
                    .map(CONTRACT_MAPPER)
                    .findOne();

            if (contract.isEmpty()) {
                return Optional.empty();
            }

            List<Participant> participants = handle.createQuery(
                            """
                            SELECT id, contract_id, user_id, habit, frequency, sign_status, opted_out_of_next_cycle, invited_at, signed_at
                            FROM participants
                            WHERE contract_id = :contractId AND sign_status != 'removed'
                            """)
                    .bind("contractId", contractId)
                    .map(ParticipantStore.PARTICIPANT_MAPPER)
                    .list();

            Optional<Integer> currentCycleNumber = handle.createQuery(
                            """
                            SELECT cycle_number
                            FROM cycles
                            WHERE contract_id = :contractId AND status = 'active'
                            """)
                    .bind("contractId", contractId)
                    .mapTo(Integer.class)
                    .findOne();

            return Optional.of(new ContractDetail(contract.get(), participants, currentCycleNumber.orElse(null)));
        });
    }

    public Optional<Contract> updateFields(UUID contractId, String name, String forfeit, Period period, LocalDate startDate) {
        return jdbi.withHandle(handle -> handle.createQuery(
                                """
                                UPDATE contracts
                                SET name = :name, forfeit = :forfeit, period = :period, start_date = :startDate
                                WHERE id = :contractId
                                RETURNING id, creator_id, name, forfeit, period, start_date, status, created_at
                                """)
                        .bind("contractId", contractId)
                        .bind("name", name)
                        .bind("forfeit", forfeit)
                        .bind("period", period.name())
                        .bind("startDate", startDate)
                        .map(CONTRACT_MAPPER)
                        .findOne());
    }

    public Optional<Contract> updateStatus(UUID contractId, String status) {
        return jdbi.withHandle(handle -> handle.createQuery(
                                """
                                UPDATE contracts
                                SET status = :status
                                WHERE id = :contractId
                                RETURNING id, creator_id, name, forfeit, period, start_date, status, created_at
                                """)
                        .bind("contractId", contractId)
                        .bind("status", status)
                        .map(CONTRACT_MAPPER)
                        .findOne());
    }

    // -----------------------------------------------------------------------
    // Complex atomic methods
    // -----------------------------------------------------------------------

    public boolean activateContract(UUID contractId, LocalDate cycleStart, LocalDate cycleEnd, LocalDate votingDeadline, List<UUID> signedParticipantIds) {
        return jdbi.inTransaction(handle -> {
            int updated = handle.createUpdate(
                            """
                            UPDATE contracts
                            SET status = 'active'
                            WHERE id = :contractId AND status = 'draft'
                            """)
                    .bind("contractId", contractId)
                    .execute();

            if (updated == 0) {
                return false;
            }

            Cycle cycle = handle.createQuery(
                            """
                            INSERT INTO cycles (contract_id, cycle_number, start_date, end_date, voting_deadline, status)
                            VALUES (:contractId, 1, :startDate, :endDate, :votingDeadline, 'active')
                            RETURNING id, contract_id, cycle_number, start_date, end_date, voting_deadline, status
                            """)
                    .bind("contractId", contractId)
                    .bind("startDate", cycleStart)
                    .bind("endDate", cycleEnd)
                    .bind("votingDeadline", votingDeadline)
                    .map(CycleStore.CYCLE_MAPPER)
                    .one();

            batchInsertHabitActions(handle, cycle.id(), signedParticipantIds);
            return true;
        });
    }

    public Optional<Cycle> advanceCycleToResolution(UUID currentCycleId, UUID contractId, int nextCycleNumber, LocalDate nextStart, LocalDate nextEnd, LocalDate nextVotingDeadline, List<UUID> activeParticipantIds) {
        return jdbi.inTransaction(handle -> {
            int updated = handle.createUpdate(
                            """
                            UPDATE cycles
                            SET status = 'pending_resolution'
                            WHERE id = :currentCycleId AND contract_id = :contractId
                            """)
                    .bind("currentCycleId", currentCycleId)
                    .bind("contractId", contractId)
                    .execute();

            if (updated == 0) {
                return Optional.empty();
            }

            Cycle nextCycle = handle.createQuery(
                            """
                            INSERT INTO cycles (contract_id, cycle_number, start_date, end_date, voting_deadline, status)
                            VALUES (:contractId, :cycleNumber, :startDate, :endDate, :votingDeadline, 'active')
                            RETURNING id, contract_id, cycle_number, start_date, end_date, voting_deadline, status
                            """)
                    .bind("contractId", contractId)
                    .bind("cycleNumber", nextCycleNumber)
                    .bind("startDate", nextStart)
                    .bind("endDate", nextEnd)
                    .bind("votingDeadline", nextVotingDeadline)
                    .map(CycleStore.CYCLE_MAPPER)
                    .one();

            if (!activeParticipantIds.isEmpty()) {
                batchInsertHabitActions(handle, nextCycle.id(), activeParticipantIds);
            }

            return Optional.of(nextCycle);
        });
    }

    public void endContractIfEmpty(UUID contractId) {
        jdbi.useHandle(handle -> handle.createUpdate(
                        """
                        UPDATE contracts
                        SET status = 'ended'
                        WHERE id = :contractId AND status = 'active'
                          AND NOT EXISTS (
                            SELECT 1 FROM participants
                            WHERE contract_id = :contractId
                              AND sign_status = 'signed'
                              AND opted_out_of_next_cycle = false
                          )
                        """)
                .bind("contractId", contractId)
                .execute());
    }

    // -----------------------------------------------------------------------
    // Dashboard methods
    // -----------------------------------------------------------------------

    public List<ActiveContractRow> getActiveContracts(UUID userId) {
        return fetchContractRows(userId, "active");
    }

    public List<ActiveContractRow> getPendingResolutionContracts(UUID userId) {
        return fetchContractRows(userId, "pending_resolution");
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /** Fetches each participant's frequency then batch-inserts one habit_action per slot. */
    private void batchInsertHabitActions(Handle handle, UUID cycleId, List<UUID> participantIds) {
        List<Object[]> frequencies = handle.createQuery(
                        """
                        SELECT id, frequency
                        FROM participants
                        WHERE id = ANY(:participantIds)
                        """)
                .bind("participantIds", participantIds.toArray(new UUID[0]))
                .map((rs, ctx) -> new Object[] {
                        rs.getObject("id", UUID.class),
                        rs.getObject("frequency", Integer.class)
                })
                .list();

        PreparedBatch batch = handle.prepareBatch(
                "INSERT INTO habit_actions (cycle_id, participant_id, action_number) VALUES (:cycleId, :participantId, :actionNumber)");

        for (Object[] row : frequencies) {
            UUID participantId = (UUID) row[0];
            Integer frequency = (Integer) row[1];
            if (frequency == null) {
                throw new ConflictException("Participant " + participantId + " has null frequency — cannot create habit actions");
            }
            for (int i = 1; i <= frequency; i++) {
                batch.bind("cycleId", cycleId)
                        .bind("participantId", participantId)
                        .bind("actionNumber", i)
                        .add();
            }
        }

        if (!frequencies.isEmpty()) {
            batch.execute();
        }
    }

    /**
     * Shared query for both dashboard list methods — cycleStatus ('active' or 'pending_resolution')
     * determines which cycle is joined per contract.
     */
    private List<ActiveContractRow> fetchContractRows(UUID userId, String cycleStatus) {
        return jdbi.withHandle(handle -> {
            List<Object[]> contractsAndCycles = handle.createQuery(
                            """
                            SELECT c.id, c.creator_id, c.name, c.forfeit, c.period, c.start_date, c.status, c.created_at,
                                   cy.id AS cy_id, cy.contract_id AS cy_contract_id, cy.cycle_number, cy.start_date AS cy_start_date, cy.end_date, cy.voting_deadline, cy.status AS cy_status
                            FROM contracts c
                            JOIN cycles cy ON cy.contract_id = c.id AND cy.status = :cycleStatus
                            JOIN participants me ON me.contract_id = c.id
                              AND me.user_id = :userId AND me.sign_status = 'signed'
                            WHERE c.status = 'active'
                            """)
                    .bind("userId", userId)
                    .bind("cycleStatus", cycleStatus)
                    .map((rs, ctx) -> new Object[] {
                            new Contract(
                                    rs.getObject("id", UUID.class),
                                    rs.getObject("creator_id", UUID.class),
                                    rs.getString("name"),
                                    rs.getString("forfeit"),
                                    Period.fromValue(rs.getString("period")),
                                    rs.getObject("start_date", LocalDate.class),
                                    rs.getString("status"),
                                    rs.getTimestamp("created_at").toInstant()),
                            new Cycle(
                                    rs.getObject("cy_id", UUID.class),
                                    rs.getObject("cy_contract_id", UUID.class),
                                    rs.getInt("cycle_number"),
                                    rs.getObject("cy_start_date", LocalDate.class),
                                    rs.getObject("end_date", LocalDate.class),
                                    rs.getObject("voting_deadline", LocalDate.class),
                                    rs.getString("cy_status"))
                    })
                    .list();

            if (contractsAndCycles.isEmpty()) {
                return List.of();
            }

            List<UUID> contractIds = contractsAndCycles.stream()
                    .map(row -> ((Contract) row[0]).id())
                    .distinct()
                    .toList();

            List<Participant> participants = handle.createQuery(
                            """
                            SELECT id, contract_id, user_id, habit, frequency, sign_status, opted_out_of_next_cycle, invited_at, signed_at
                            FROM participants
                            WHERE contract_id = ANY(:contractIds) AND sign_status = 'signed'
                            """)
                    .bind("contractIds", contractIds.toArray(new UUID[0]))
                    .map(ParticipantStore.PARTICIPANT_MAPPER)
                    .list();

            List<ActiveContractRow> result = new ArrayList<>();
            for (Object[] row : contractsAndCycles) {
                Contract contract = (Contract) row[0];
                Cycle cycle = (Cycle) row[1];
                List<Participant> contractParticipants = participants.stream()
                        .filter(p -> p.contractId().equals(contract.id()))
                        .toList();
                result.add(new ActiveContractRow(contract, cycle, contractParticipants));
            }

            return result;
        });
    }
}
