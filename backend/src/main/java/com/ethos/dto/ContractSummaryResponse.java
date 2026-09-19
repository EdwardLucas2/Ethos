package com.ethos.dto;

import java.util.List;
import java.util.UUID;

public record ContractSummaryResponse(
        UUID contractId, String name, String status, Integer cycleNumber, List<String> opponentNames) {}
