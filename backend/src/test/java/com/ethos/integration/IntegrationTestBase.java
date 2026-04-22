package com.ethos.integration;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.sqlobject.SqlObjectPlugin;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import com.ethos.testutil.Dbmate;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Base class for all integration tests. Manages a shared PostgreSQL container (started once per
 * JVM, not per test class) and provides a configured Jdbi instance. Each test method gets a clean
 * database via a @BeforeEach truncate.
 *
 * <p>Extend this class for any test that needs a real database. The container is started lazily on
 * first class load and reused for the lifetime of the test run.
 */
@Tag("integration")
public abstract class IntegrationTestBase {

    private static final String DB_NAME = "ethos_test";
    private static final String DB_USER = "test";
    private static final String DB_PASSWORD = "test";

    // Testcontainers registers a JVM shutdown hook to stop the container — no explicit close needed.
    @SuppressWarnings("resource")
    private static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>(System.getProperty("postgres.image"))
                    .withDatabaseName(DB_NAME)
                    .withUsername(DB_USER)
                    .withPassword(DB_PASSWORD);

    // Held for the JVM lifetime; closed by HikariCP's own shutdown hook.
    @SuppressWarnings("resource")
    private static final HikariDataSource DATA_SOURCE;

    /** Shared Jdbi instance. Available to all subclasses. */
    protected static final Jdbi JDBI;

    static {
        POSTGRES.start();

        var config = new HikariConfig();
        config.setJdbcUrl(POSTGRES.getJdbcUrl());
        config.setUsername(POSTGRES.getUsername());
        config.setPassword(POSTGRES.getPassword());

        DATA_SOURCE = new HikariDataSource(config);
        JDBI = Jdbi.create(DATA_SOURCE);
        JDBI.installPlugin(new SqlObjectPlugin());

        Dbmate.migrate(POSTGRES.getHost(), POSTGRES.getMappedPort(5432), DB_USER, DB_PASSWORD, DB_NAME);
    }

    /**
     * Truncates all public tables before each test so tests are fully independent. Tables are
     * discovered dynamically from information_schema so no list needs updating when migrations add
     * new tables. CASCADE handles FK dependency ordering automatically.
     */
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
