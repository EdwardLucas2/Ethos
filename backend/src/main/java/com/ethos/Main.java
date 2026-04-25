package com.ethos;

import com.ethos.auth.JwtVerifier;
import com.ethos.config.AppConfig;
import com.ethos.handler.UserHandler;
import com.ethos.service.UserService;
import com.ethos.store.UserStore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import io.javalin.Javalin;
import io.javalin.json.JavalinJackson;
import io.javalin.openapi.plugin.OpenApiPlugin;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.sqlobject.SqlObjectPlugin;

public class Main {

    public static void main(String[] args) {
        var config = AppConfig.fromEnv();
        var ds = buildDataSource(config);
        var jdbi = buildJdbi(ds);
        var router = buildObjectGraph(config, jdbi);
        startServer(config, router);
    }

    private static HikariDataSource buildDataSource(AppConfig config) {
        var hikari = new HikariConfig();
        hikari.setJdbcUrl(config.databaseUrl());
        hikari.setUsername(config.databaseUser());
        hikari.setPassword(config.databasePassword());
        return new HikariDataSource(hikari);
    }

    private static Jdbi buildJdbi(HikariDataSource ds) {
        var jdbi = Jdbi.create(ds);
        jdbi.installPlugin(new SqlObjectPlugin());
        return jdbi;
    }

    private static AppRouter buildObjectGraph(AppConfig config, Jdbi jdbi) {
        var jwtVerifier = JwtVerifier.fromJwksUrl(config.supertokensUrl() + "/.well-known/jwks.json");
        var userStore = new UserStore(jdbi);
        var userHandler = new UserHandler(new UserService(userStore));
        return new AppRouter(jwtVerifier, userStore, userHandler);
    }

    public static Javalin buildJavalin(AppRouter router) {
        return Javalin.create(config -> {
            config.jsonMapper(new JavalinJackson()
                    .updateMapper(mapper -> mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL)));
            config.registerPlugin(
                    new OpenApiPlugin(openApiConfig -> openApiConfig.withDocumentationPath("/openapi.json")));
            router.configure(config.routes);
        });
    }

    private static void startServer(AppConfig config, AppRouter router) {
        buildJavalin(router).start(config.port());
    }
}
