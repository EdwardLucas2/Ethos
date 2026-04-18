package com.ethos.integration;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.stream.Collectors;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.sqlobject.SqlObjectPlugin;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
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

    // Testcontainers registers a JVM shutdown hook to stop the container — no explicit close needed.
    @SuppressWarnings("resource")
    private static final PostgreSQLContainer<?> POSTGRES;

    /** Shared Jdbi instance. Available to all subclasses. */
    protected static final Jdbi JDBI;

    static {
        POSTGRES = new PostgreSQLContainer<>("postgres:17")
                .withDatabaseName("ethos_test")
                .withUsername("test")
                .withPassword("test");
        POSTGRES.start();

        var config = new HikariConfig();
        config.setJdbcUrl(POSTGRES.getJdbcUrl());
        config.setUsername(POSTGRES.getUsername());
        config.setPassword(POSTGRES.getPassword());

        JDBI = Jdbi.create(new HikariDataSource(config));
        JDBI.installPlugin(new SqlObjectPlugin());

        applyMigrations();
    }

    /**
     * Reads all dbmate migration files from db/migrations/ in filename order and applies the
     * migrate:up block of each to the test database. This keeps tests aligned with the real schema
     * without duplicating any SQL.
     */
    private static void applyMigrations() {
        var migrationsDir = Paths.get("db/migrations");
        try (var stream = Files.list(migrationsDir)) {
            var migrationFiles = stream.filter(p -> p.toString().endsWith(".sql"))
                    .sorted(Comparator.comparing(Path::getFileName))
                    .collect(Collectors.toList());

            JDBI.useHandle(handle -> {
                for (var file : migrationFiles) {
                    var sql = extractUpBlock(file);
                    if (!sql.isBlank()) {
                        handle.execute(sql);
                    }
                }
            });
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to list migrations directory: " + migrationsDir, e);
        }
    }

    private static String extractUpBlock(Path file) {
        try {
            var content = Files.readString(file);
            var upMarker = "-- migrate:up";
            var downMarker = "-- migrate:down";
            var upStart = content.indexOf(upMarker);
            if (upStart == -1) {
                return content;
            }
            upStart += upMarker.length();
            var downStart = content.indexOf(downMarker);
            return downStart == -1 ? content.substring(upStart) : content.substring(upStart, downStart);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read migration file: " + file, e);
        }
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
