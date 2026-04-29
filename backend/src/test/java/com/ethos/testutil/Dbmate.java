package com.ethos.testutil;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class Dbmate {

    public static void migrate(String host, int port, String user, String password, String dbName) {
        String encodedUser = URLEncoder.encode(user, StandardCharsets.UTF_8);
        String encodedPassword = URLEncoder.encode(password, StandardCharsets.UTF_8);
        String url = String.format(
                "postgresql://%s:%s@%s:%d/%s?sslmode=disable", encodedUser, encodedPassword, host, port, dbName);
        try {
            var process = new ProcessBuilder(
                            "dbmate", "--url", url, "--migrations-dir", "db/migrations", "--no-dump-schema", "up")
                    .redirectErrorStream(true)
                    .start();
            var output = new String(process.getInputStream().readAllBytes());
            if (process.waitFor() != 0) {
                throw new RuntimeException("dbmate migration failed:\n" + output);
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to run dbmate", e);
        }
    }
}
