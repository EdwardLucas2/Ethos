package com.ethos.router;

import io.javalin.security.RouteRole;

public enum Role implements RouteRole {
    ANYONE,
    JWT_ONLY,
    FULL
}
