package com.ethos.model;

import java.util.List;

public record ActiveContractRow(Contract contract, Cycle cycle, List<Participant> participants) {}
