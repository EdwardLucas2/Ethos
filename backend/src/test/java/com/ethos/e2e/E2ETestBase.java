package com.ethos.e2e;

import com.ethos.AppRouter;
import com.ethos.Main;
import com.ethos.auth.JwtVerifier;
import com.ethos.auth.SuperTokensCoreClient;
import com.ethos.handler.AuthHandler;
import com.ethos.handler.UserHandler;
import com.ethos.service.UserService;
import com.ethos.store.UserStore;
import com.ethos.testutil.Dbmate;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import io.javalin.Javalin;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.sqlobject.SqlObjectPlugin;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.Network;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.wait.strategy.Wait;

/**
 * Base class for all E2E tests. Starts three containers once per JVM — PostgreSQL (app DB +
 * SuperTokens DB), SuperTokens Core — and a Javalin server wired against them. Each test gets a
 * clean database via @BeforeEach truncation.
 */
@Tag("e2e")
public abstract class E2ETestBase {

    private static final Network NETWORK = Network.newNetwork();

    private static final String DB_NAME = "ethos_test";
    private static final String DB_USER = "test";
    private static final String DB_PASSWORD = "test";
    private static final String POSTGRES_ALIAS = "postgres";

    @SuppressWarnings("resource")
    private static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(
                    System.getProperty("postgres.image"))
            .withNetwork(NETWORK)
            .withNetworkAliases(POSTGRES_ALIAS)
            .withDatabaseName(DB_NAME)
            .withUsername(DB_USER)
            .withPassword(DB_PASSWORD);

    private static final GenericContainer<?> SUPERTOKENS;

    protected static final Jdbi JDBI;
    protected static final HttpClient HTTP = HttpClient.newHttpClient();
    protected static final ObjectMapper MAPPER = new ObjectMapper();
    protected static final String APP_URL;

    static {
        POSTGRES.start();

        // Create a second database in the same PG instance for SuperTokens' internal tables
        try {
            POSTGRES.execInContainer("psql", "-U", DB_USER, "-d", DB_NAME, "-c", "CREATE DATABASE supertokens");
        } catch (Exception e) {
            throw new RuntimeException("Failed to create supertokens database", e);
        }

        SUPERTOKENS = buildSupertokensContainer();
        SUPERTOKENS.start();

        var hikari = new HikariConfig();
        hikari.setJdbcUrl(POSTGRES.getJdbcUrl());
        hikari.setUsername(POSTGRES.getUsername());
        hikari.setPassword(POSTGRES.getPassword());
        @SuppressWarnings("resource")
        var ds = new HikariDataSource(hikari);

        JDBI = Jdbi.create(ds);
        JDBI.installPlugin(new SqlObjectPlugin());
        Dbmate.migrate(POSTGRES.getHost(), POSTGRES.getMappedPort(5432), DB_USER, DB_PASSWORD, DB_NAME);

        var supertokensUrl = "http://localhost:" + SUPERTOKENS.getMappedPort(3567);
        var superTokensCoreClient = new SuperTokensCoreClient(supertokensUrl);
        var jwtVerifier = JwtVerifier.fromJwksUrl(supertokensUrl + "/.well-known/jwks.json");
        var userStore = new UserStore(JDBI);
        var appRouter = new AppRouter(
                jwtVerifier,
                userStore,
                new UserHandler(new UserService(userStore)),
                new AuthHandler(superTokensCoreClient));

        Javalin app = Main.buildJavalin(appRouter).start(0);
        APP_URL = "http://localhost:" + app.port();
    }

    @SuppressWarnings("resource")
    private static GenericContainer<?> buildSupertokensContainer() {
        return new GenericContainer<>(System.getProperty("supertokens.image"))
                .withNetwork(NETWORK)
                .withExposedPorts(3567)
                .withEnv(
                        "POSTGRESQL_CONNECTION_URI",
                        "postgresql://" + DB_USER + ":" + DB_PASSWORD + "@" + POSTGRES_ALIAS + ":5432/supertokens")
                .waitingFor(Wait.forHttp("/hello").forStatusCode(200));
    }

    /**
     * Signs up a new user with a random email and returns the access token. Use this in tests that
     * need a valid JWT but don't care about the specific email.
     */
    protected static String signupAndGetJwt() throws Exception {
        return signupAndGetJwt(UUID.randomUUID() + "@test.com");
    }

    /**
     * Signs up a new user with the given email and returns the access token.
     */
    protected static String signupAndGetJwt(String email) throws Exception {
        var body = MAPPER.writeValueAsString(
                MAPPER.createObjectNode().put("email", email).put("password", "Test1234!"));
        var request = HttpRequest.newBuilder()
                .uri(URI.create(APP_URL + "/auth/signup"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        var response = HTTP.send(request, HttpResponse.BodyHandlers.ofString());
        return MAPPER.readTree(response.body()).get("accessToken").asText();
    }

    @BeforeEach
    void resetDatabase() {
        JDBI.useHandle(h -> {
            var tables = h.createQuery(
                            """
                            SELECT table_name
                            FROM information_schema.tables
                            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                            """)
                    .mapTo(String.class)
                    .list();
            if (!tables.isEmpty()) {
                h.execute("TRUNCATE " + String.join(", ", tables) + " CASCADE");
            }
        });
    }
}
