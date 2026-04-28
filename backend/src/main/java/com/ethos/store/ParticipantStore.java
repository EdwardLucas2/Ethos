package com.ethos.store;

import com.ethos.exception.ConflictException;
import com.ethos.model.Participant;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;
import org.postgresql.util.PSQLException;

public class ParticipantStore {

    private final Jdbi jdbi;

    static final RowMapper<Participant> PARTICIPANT_MAPPER = (rs, ctx) -> new Participant(
            rs.getObject("id", UUID.class),
            rs.getObject("contract_id", UUID.class),
            rs.getObject("user_id", UUID.class),
            rs.getString("habit"),
            rs.getObject("frequency", Integer.class),
            rs.getString("sign_status"),
            rs.getBoolean("opted_out_of_next_cycle"),
            rs.getTimestamp("invited_at").toInstant(),
            rs.getTimestamp("signed_at") == null
                    ? null
                    : rs.getTimestamp("signed_at").toInstant());

    public ParticipantStore(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    public Participant insertParticipant(UUID contractId, UUID userId) {
        try {
            return jdbi.withHandle(handle -> handle.createQuery(
                            """
                            INSERT INTO participants (contract_id, user_id, sign_status)
                            VALUES (:contractId, :userId, 'waiting')
                            RETURNING id, contract_id, user_id, habit, frequency, sign_status, opted_out_of_next_cycle, invited_at, signed_at
                            """)
                    .bind("contractId", contractId)
                    .bind("userId", userId)
                    .map(PARTICIPANT_MAPPER)
                    .one());
        } catch (UnableToExecuteStatementException e) {
            if (e.getCause() instanceof PSQLException psql && "23505".equals(psql.getSQLState())) {
                throw new ConflictException("User is already a participant in this contract");
            }
            throw e;
        }
    }

    public Optional<Participant> findParticipantById(UUID participantId) {
        return jdbi.withHandle(handle -> handle.createQuery(
                        """
                        SELECT id, contract_id, user_id, habit, frequency, sign_status, opted_out_of_next_cycle, invited_at, signed_at
                        FROM participants
                        WHERE id = :participantId
                        """)
                .bind("participantId", participantId)
                .map(PARTICIPANT_MAPPER)
                .findOne());
    }

    public Optional<Participant> findParticipantByContractAndUser(UUID contractId, UUID userId) {
        return jdbi.withHandle(handle -> handle.createQuery(
                        """
                        SELECT id, contract_id, user_id, habit, frequency, sign_status, opted_out_of_next_cycle, invited_at, signed_at
                        FROM participants
                        WHERE contract_id = :contractId AND user_id = :userId
                        """)
                .bind("contractId", contractId)
                .bind("userId", userId)
                .map(PARTICIPANT_MAPPER)
                .findOne());
    }

    public List<Participant> findAllParticipantsByCycleId(UUID cycleId) {
        return jdbi.withHandle(handle -> handle.createQuery(
                        """
                        SELECT DISTINCT p.id, p.contract_id, p.user_id, p.habit, p.frequency, p.sign_status, p.opted_out_of_next_cycle, p.invited_at, p.signed_at
                        FROM participants p
                        JOIN habit_actions ha ON ha.participant_id = p.id
                        WHERE ha.cycle_id = :cycleId
                        """)
                .bind("cycleId", cycleId)
                .map(PARTICIPANT_MAPPER)
                .list());
    }

    public Optional<Participant> updateParticipantSignStatus(UUID participantId, String signStatus, Instant signedAt) {
        return jdbi.withHandle(handle -> handle.createQuery(
                        """
                        UPDATE participants
                        SET sign_status = :signStatus, signed_at = :signedAt
                        WHERE id = :participantId
                        RETURNING id, contract_id, user_id, habit, frequency, sign_status, opted_out_of_next_cycle, invited_at, signed_at
                        """)
                .bind("participantId", participantId)
                .bind("signStatus", signStatus)
                .bind("signedAt", signedAt)
                .map(PARTICIPANT_MAPPER)
                .findOne());
    }

    public Optional<Participant> updateParticipantCommitment(UUID participantId, String habit, Integer frequency) {
        return jdbi.withHandle(handle -> handle.createQuery(
                        """
                        UPDATE participants
                        SET habit = :habit, frequency = :frequency
                        WHERE id = :participantId
                        RETURNING id, contract_id, user_id, habit, frequency, sign_status, opted_out_of_next_cycle, invited_at, signed_at
                        """)
                .bind("participantId", participantId)
                .bind("habit", habit)
                .bind("frequency", frequency)
                .map(PARTICIPANT_MAPPER)
                .findOne());
    }

    public void updateParticipantOptOut(UUID participantId) {
        jdbi.useHandle(handle -> handle.createUpdate(
                        """
                        UPDATE participants
                        SET opted_out_of_next_cycle = true
                        WHERE id = :participantId
                        """)
                .bind("participantId", participantId)
                .execute());
    }

    public int countSignedParticipants(UUID contractId) {
        return jdbi.withHandle(handle -> handle.createQuery(
                        """
                        SELECT COUNT(*)
                        FROM participants
                        WHERE contract_id = :contractId AND sign_status = 'signed'
                        """)
                .bind("contractId", contractId)
                .mapTo(Integer.class)
                .one());
    }
}
