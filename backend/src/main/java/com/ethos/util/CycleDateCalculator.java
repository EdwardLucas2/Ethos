package com.ethos.util;

import com.ethos.model.Period;
import java.time.LocalDate;

public final class CycleDateCalculator {

    public static final int VOTING_WINDOW_DAYS = 3;

    private CycleDateCalculator() {}

    public record CycleDates(LocalDate startDate, LocalDate endDate, LocalDate votingDeadline) {}

    public static CycleDates compute(LocalDate startDate, Period period) {
        LocalDate endDate =
                switch (period) {
                    case WEEKLY -> startDate.plusDays(6);
                    case BIWEEKLY -> startDate.plusDays(13);
                    case MONTHLY -> startDate.plusMonths(1).minusDays(1);
                };
        return new CycleDates(startDate, endDate, endDate.plusDays(VOTING_WINDOW_DAYS));
    }
}
