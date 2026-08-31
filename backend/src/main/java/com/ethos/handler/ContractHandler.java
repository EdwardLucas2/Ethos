package com.ethos.handler;

import com.ethos.RequestAttributes;
import com.ethos.dto.ActiveContractResponse;
import com.ethos.dto.ContractResponse;
import com.ethos.dto.ContractSummaryResponse;
import com.ethos.dto.ErrorResponse;
import com.ethos.dto.PendingResolutionContractResponse;
import com.ethos.service.ContractService;
import io.javalin.http.Context;
import io.javalin.openapi.HttpMethod;
import io.javalin.openapi.OpenApi;
import io.javalin.openapi.OpenApiContent;
import io.javalin.openapi.OpenApiResponse;
import java.util.UUID;

public class ContractHandler {

    private final ContractService contractService;

    public ContractHandler(ContractService contractService) {
        this.contractService = contractService;
    }

    @OpenApi(
            path = "/contracts",
            methods = {HttpMethod.POST},
            summary = "Create contract",
            description = "Called on FAB tap. Creates a contract with default values (name and forfeit empty,"
                    + " period weekly, start date tomorrow UTC, status draft) and a participant row for the"
                    + " caller with sign_status drafting. Everything stays mutable until"
                    + " POST /contracts/{contractId}/start.",
            tags = {"contracts"},
            responses = {
                @OpenApiResponse(
                        status = "201",
                        content = @OpenApiContent(from = ContractResponse.class),
                        description = "Contract created"),
                @OpenApiResponse(
                        status = "401",
                        content = @OpenApiContent(from = ErrorResponse.class),
                        description = "JWT missing or invalid")
            })
    public void createContract(Context ctx) {
        UUID userId = ctx.attribute(RequestAttributes.USER_ID);
        ctx.status(201).json(contractService.createContract(userId));
    }

    @OpenApi(
            path = "/contracts/me",
            methods = {HttpMethod.GET},
            summary = "List the caller's contracts",
            description = "Returns every contract the caller is or was a participant in — active,"
                    + " pending_resolution, and settled — most recent first. Backs the Contracts tab's full"
                    + " list/history, distinct from GET /contracts/me/active and"
                    + " GET /contracts/me/pending-resolution, which the Dashboard uses for its curated,"
                    + " needs-attention view and only cover active/pending_resolution.",
            tags = {"contracts"},
            responses = {
                @OpenApiResponse(
                        status = "200",
                        content = @OpenApiContent(from = ContractSummaryResponse[].class),
                        description = "All contracts"),
                @OpenApiResponse(
                        status = "401",
                        content = @OpenApiContent(from = ErrorResponse.class),
                        description = "JWT missing or invalid")
            })
    public void getMyContracts(Context ctx) {
        UUID userId = ctx.attribute(RequestAttributes.USER_ID);
        ctx.json(contractService.listContracts(userId));
    }

    @OpenApi(
            path = "/contracts/me/active",
            methods = {HttpMethod.GET},
            summary = "List the caller's active contracts",
            description = "Returns contracts where status is active and the caller is a signed participant,"
                    + " carrying all data needed for the Dashboard contract card: current cycle progress,"
                    + " per-participant progress, and unreviewed evidence count.",
            tags = {"contracts"},
            responses = {
                @OpenApiResponse(
                        status = "200",
                        content = @OpenApiContent(from = ActiveContractResponse[].class),
                        description = "Active contracts"),
                @OpenApiResponse(
                        status = "401",
                        content = @OpenApiContent(from = ErrorResponse.class),
                        description = "JWT missing or invalid")
            })
    public void getActiveContracts(Context ctx) {
        UUID userId = ctx.attribute(RequestAttributes.USER_ID);
        ctx.json(contractService.listActiveContracts(userId));
    }

    @OpenApi(
            path = "/contracts/me/pending-resolution",
            methods = {HttpMethod.GET},
            summary = "List the caller's pending-resolution contracts",
            description = "Returns contracts where the caller is a signed participant and a cycle has status"
                    + " pending_resolution. A contract can appear here and in GET /contracts/me/active"
                    + " simultaneously during the overlap period — they represent different cycles.",
            tags = {"contracts"},
            responses = {
                @OpenApiResponse(
                        status = "200",
                        content = @OpenApiContent(from = PendingResolutionContractResponse[].class),
                        description = "Pending-resolution contracts"),
                @OpenApiResponse(
                        status = "401",
                        content = @OpenApiContent(from = ErrorResponse.class),
                        description = "JWT missing or invalid")
            })
    public void getPendingResolutionContracts(Context ctx) {
        UUID userId = ctx.attribute(RequestAttributes.USER_ID);
        ctx.json(contractService.listPendingResolutionContracts(userId));
    }
}
