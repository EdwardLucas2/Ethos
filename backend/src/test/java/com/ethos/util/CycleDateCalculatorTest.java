package com.ethos.util;

import static org.junit.jupiter.api.Assertions.*;

import com.ethos.model.Period;
import com.ethos.util.CycleDateCalculator.CycleDates;
import java.time.LocalDate;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class CycleDateCalculatorTest {

    private static final LocalDate START = LocalDate.of(2026, 5, 1);

    @Nested
    class Compute {

        @Test
        void givenWeeklyPeriod_returnsSevenDayCycle() {
            CycleDates result = CycleDateCalculator.compute(START, Period.WEEKLY);
            assertEquals(START, result.startDate());
            assertEquals(LocalDate.of(2026, 5, 7), result.endDate());
            assertEquals(LocalDate.of(2026, 5, 10), result.votingDeadline());
        }

        @Test
        void givenBiweeklyPeriod_returnsFourteenDayCycle() {
            CycleDates result = CycleDateCalculator.compute(START, Period.BIWEEKLY);
            assertEquals(LocalDate.of(2026, 5, 14), result.endDate());
            assertEquals(LocalDate.of(2026, 5, 17), result.votingDeadline());
        }

        @Test
        void givenMonthlyPeriod_returnsCalendarMonthCycle() {
            CycleDates result = CycleDateCalculator.compute(START, Period.MONTHLY);
            assertEquals(LocalDate.of(2026, 5, 31), result.endDate());
            assertEquals(LocalDate.of(2026, 6, 3), result.votingDeadline());
        }
    }
}
