package com.ethos.store;

import com.ethos.model.Cycle;
import com.ethos.model.CycleStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.core.mapper.RowMapper;

public class CycleStore {

    private final Jdbi jdbi;

    static final RowMapper<Cycle> CYCLE_MAPPER = (rs, ctx) -> new Cycle(
            rs.getObject("id", UUID.class),
            rs.getObject("contract_id", UUID.class),
            rs.getInt("cycle_number"),
            rs.getObject("start_date", LocalDate.class),
            rs.getObject("end_date", LocalDate.class),
            rs.getObject("voting_deadline", LocalDate.class),
            CycleStatus.valueOf(rs.getString("status")));

    public CycleStore(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    public Optional<Cycle> findCycleByContractAndNumber(UUID contractId, int cycleNumber) {
        return jdbi.withHandle(handle -> handle.createQuery(
                        """
                        SELECT id, contract_id, cycle_number, start_date, end_date, voting_deadline, status
                        FROM cycles
                        WHERE contract_id = :contractId AND cycle_number = :cycleNumber
                        """)
                .bind("contractId", contractId)
                .bind("cycleNumber", cycleNumber)
                .map(CYCLE_MAPPER)
                .findOne());
    }

    public List<Cycle> findCyclesDueForTransition() {
        return jdbi.withHandle(handle -> handle.createQuery(
                        """
                        SELECT id, contract_id, cycle_number, start_date, end_date, voting_deadline, status
                        FROM cycles
                        WHERE (status = 'ACTIVE' AND end_date < CURRENT_DATE)
                           OR (status = 'PENDING_RESOLUTION' AND voting_deadline <= CURRENT_DATE)
                        """)
                .map(CYCLE_MAPPER)
                .list());
    }

    public void updateCycleStatus(UUID cycleId, CycleStatus status) {
        jdbi.useHandle(handle -> handle.createUpdate(
                        """
                        UPDATE cycles
                        SET status = :status
                        WHERE id = :cycleId
                        """)
                .bind("cycleId", cycleId)
                .bind("status", status)
                .execute());
    }
}
