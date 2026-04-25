package com.ethos.e2e;

import com.ethos.AppRouter;
import com.ethos.Main;
import com.ethos.auth.JwtVerifier;
import com.ethos.auth.SuperTokensCoreClient;
import com.ethos.handler.UserHandler;
import com.ethos.service.UserService;
import com.ethos.store.UserStore;
import com.ethos.testutil.Dbmate;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import io.javalin.Javalin;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Base64;
import java.util.HashSet;
import java.util.Set;
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
    private static final GenericContainer<?> AUTH_SERVER;
    private static final String SUPERTOKENS_ALIAS = "supertokens";

    protected static final SuperTokensCoreClient SUPERTOKENS_CLIENT;
    protected static final Jdbi JDBI;
    protected static final HttpClient HTTP = HttpClient.newHttpClient();
    protected static final ObjectMapper MAPPER = new ObjectMapper();
    protected static final String APP_URL;
    protected static final String AUTH_URL;

    private static final ThreadLocal<Set<String>> SUPERTOKENS_USER_IDS = ThreadLocal.withInitial(HashSet::new);

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

        AUTH_SERVER = buildAuthServerContainer();
        AUTH_SERVER.start();

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
        var authServerUrl = "http://localhost:" + AUTH_SERVER.getMappedPort(3568);
        AUTH_URL = authServerUrl;
        SUPERTOKENS_CLIENT = new SuperTokensCoreClient(supertokensUrl);
        var jwtVerifier = JwtVerifier.fromJwksUrl(supertokensUrl + "/.well-known/jwks.json");
        var userStore = new UserStore(JDBI);
        var appRouter = new AppRouter(jwtVerifier, userStore, new UserHandler(new UserService(userStore)));

        Javalin app = Main.buildJavalin(appRouter).start(0);
        APP_URL = "http://localhost:" + app.port();
    }

    @SuppressWarnings("resource")
    private static GenericContainer<?> buildSupertokensContainer() {
        return new GenericContainer<>(System.getProperty("supertokens.image"))
                .withNetwork(NETWORK)
                .withExposedPorts(3567)
                .withNetworkAliases("supertokens")
                .withEnv(
                        "POSTGRESQL_CONNECTION_URI",
                        "postgresql://" + DB_USER + ":" + DB_PASSWORD + "@" + POSTGRES_ALIAS + ":5432/supertokens")
                .waitingFor(Wait.forHttp("/hello").forStatusCode(200));
    }

    @SuppressWarnings("resource")
    private static GenericContainer<?> buildAuthServerContainer() {
        var supertokensUrl = "http://" + SUPERTOKENS_ALIAS + ":3567";
        return new GenericContainer<>(System.getProperty("auth.image"))
                .withNetwork(NETWORK)
                .withExposedPorts(3568)
                .withEnv("SUPERTOKENS_CORE_URL", supertokensUrl)
                .withEnv("API_DOMAIN", "http://localhost:8080")
                .withEnv("WEBSITE_DOMAIN", "http://localhost:8080")
                .waitingFor(Wait.forHttp("/health").forStatusCode(200));
    }

    /**
     * Signs up a new user via the auth server (Express + SuperTokens) and returns the access token.
     * This exercises the full auth server flow rather than calling SuperTokens Core directly.
     */
    protected static String signUpViaAuthServer(String email, String password) throws Exception {
        var body = MAPPER.createObjectNode();
        var createFormFields = MAPPER.createArrayNode();
        createFormFields.add(createFormField("email", email));
        createFormFields.add(createFormField("password", password));
        body.set("formFields", createFormFields);

        var request = HttpRequest.newBuilder()
                .uri(URI.create(AUTH_URL + "/auth/signup"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(MAPPER.writeValueAsString(body)))
                .build();
        var response = HTTP.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Auth server signup failed: " + response.statusCode() + " " + response.body());
        }

        var jwt = response.headers().firstValue("st-access-token").orElseThrow();
        var userId = extractSub(jwt);
        SUPERTOKENS_USER_IDS.get().add(userId);
        return jwt;
    }

    protected static String signInViaAuthServer(String email, String password) throws Exception {
        var body = MAPPER.createObjectNode();
        var createFormFields = MAPPER.createArrayNode();
        createFormFields.add(createFormField("email", email));
        createFormFields.add(createFormField("password", password));
        body.set("formFields", createFormFields);

        var request = HttpRequest.newBuilder()
                .uri(URI.create(AUTH_URL + "/auth/signin"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(MAPPER.writeValueAsString(body)))
                .build();
        var response = HTTP.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Auth server signin failed: " + response.statusCode() + " " + response.body());
        }

        var jwt = response.headers().firstValue("st-access-token").orElseThrow();
        var userId = extractSub(jwt);
        SUPERTOKENS_USER_IDS.get().add(userId);
        return jwt;
    }

    private static String extractSub(String jwt) throws Exception {
        var payload = jwt.split("\\.")[1];
        var decoded = new String(Base64.getUrlDecoder().decode(payload));
        return MAPPER.readTree(decoded).get("sub").asText();
    }

    /**
     * Verifies the session via the auth server /me endpoint and returns the SuperTokens userId.
     */
    protected static String getUserIdViaAuthServer(String jwt) throws Exception {
        var response = HTTP.send(
                HttpRequest.newBuilder()
                        .uri(URI.create(AUTH_URL + "/me"))
                        .header("Authorization", "Bearer " + jwt)
                        .GET()
                        .build(),
                HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Auth server /me failed: " + response.statusCode() + " " + response.body());
        }

        return MAPPER.readTree(response.body()).get("userId").asText();
    }

    protected static ObjectNode createFormField(String id, String value) {
        var node = MAPPER.createObjectNode();
        node.put("id", id);
        node.put("value", value);
        return node;
    }

    /**
     * Signs up a new user with a random email and returns the access token. Use this in tests that
     * need a valid JWT but don't care about the specific email.
     */
    protected static String signupAndGetJwt() throws Exception {
        return signupAndGetJwt(UUID.randomUUID() + "@test.com");
    }

    /**
     * Signs up a new user with the given email and returns the access token. Calls SuperTokens Core
     * directly — no HTTP route on the Java backend is required for auth.
     */
    protected static String signupAndGetJwt(String email) throws Exception {
        var userId = SUPERTOKENS_CLIENT.signUp(email, "Test1234!");
        SUPERTOKENS_USER_IDS.get().add(userId);
        return SUPERTOKENS_CLIENT.createSession(userId, email);
    }

    /** Signs up, creates the users row via POST /users, and returns the access token. */
    protected static String registerAndGetJwt(String email, String displayName) throws Exception {
        var jwt = signupAndGetJwt(email);
        var body = MAPPER.writeValueAsString(MAPPER.createObjectNode().put("displayName", displayName));
        HTTP.send(
                HttpRequest.newBuilder()
                        .uri(URI.create(APP_URL + "/users"))
                        .header("Content-Type", "application/json")
                        .header("Authorization", "Bearer " + jwt)
                        .POST(HttpRequest.BodyPublishers.ofString(body))
                        .build(),
                HttpResponse.BodyHandlers.ofString());
        return jwt;
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

        var userIds = SUPERTOKENS_USER_IDS.get();
        for (var userId : userIds) {
            try {
                SUPERTOKENS_CLIENT.deleteUser(userId);
            } catch (Exception ignored) {
            }
        }
        userIds.clear();
    }
}
