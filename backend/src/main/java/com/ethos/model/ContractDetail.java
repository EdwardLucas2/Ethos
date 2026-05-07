package com.ethos.model;

import java.util.List;

public record ContractDetail(Contract contract, List<Participant> participants, Integer currentCycleNumber) {}
