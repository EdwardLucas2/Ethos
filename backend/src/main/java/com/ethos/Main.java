package com.ethos;

import com.ethos.dto.ErrorResponse;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import io.javalin.Javalin;
import org.flywaydb.core.Flyway;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.sqlobject.SqlObjectPlugin;

public class Main {

    public static void main(String[] args) {
        var ds = buildDataSource();
        runMigrations(ds);
        var jdbi = buildJdbi(ds);
        startServer(jdbi);
    }

    private static HikariDataSource buildDataSource() {
        var config = new HikariConfig();
        config.setJdbcUrl(System.getenv("DATABASE_URL"));
        config.setUsername(System.getenv("DATABASE_USER"));
        config.setPassword(System.getenv("DATABASE_PASSWORD"));
        return new HikariDataSource(config);
    }

    private static void runMigrations(HikariDataSource ds) {
        Flyway.configure().dataSource(ds).load().migrate();
    }

    private static Jdbi buildJdbi(HikariDataSource ds) {
        var jdbi = Jdbi.create(ds);
        jdbi.installPlugin(new SqlObjectPlugin());
        return jdbi;
    }

    private static void startServer(Jdbi jdbi) {
        var app = Javalin.create(config -> {
                    config.routes.get("/health", ctx -> ctx.result("OK"));

                    config.routes.exception(Exception.class, (e, ctx) -> {
                        ctx.status(500).json(new ErrorResponse("Internal server error"));
                    });
                })
                .start(8080);
    }
}
