package com.ethos.handler;

import com.ethos.RequestAttributes;
import com.ethos.dto.ErrorResponse;
import com.ethos.dto.NotificationResponse;
import com.ethos.service.NotificationService;
import io.javalin.http.Context;
import io.javalin.openapi.HttpMethod;
import io.javalin.openapi.OpenApi;
import io.javalin.openapi.OpenApiContent;
import io.javalin.openapi.OpenApiResponse;
import java.util.UUID;

public class NotificationHandler {

    private final NotificationService notificationService;

    public NotificationHandler(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @OpenApi(
            path = "/notifications",
            methods = {HttpMethod.GET},
            summary = "List unread notifications",
            description = "Returns all unread notifications for the caller, enriched server-side with the display"
                    + " context needed to render each Dashboard alert. Only unread (read_at IS NULL) rows are"
                    + " returned. Frontend is responsible for ordering by urgency (verify, challenge, settle, owed,"
                    + " pay-up).",
            tags = {"notifications"},
            responses = {
                @OpenApiResponse(
                        status = "200",
                        content = @OpenApiContent(from = NotificationResponse[].class),
                        description = "Unread notifications"),
                @OpenApiResponse(
                        status = "401",
                        content = @OpenApiContent(from = ErrorResponse.class),
                        description = "JWT missing or invalid")
            })
    public void getNotifications(Context ctx) {
        UUID userId = ctx.attribute(RequestAttributes.USER_ID);
        ctx.json(notificationService.listUnread(userId));
    }
}
