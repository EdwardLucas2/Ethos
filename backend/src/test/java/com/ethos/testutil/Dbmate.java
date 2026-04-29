package com.ethos.testutil;

public class Dbmate {

    public static void migrate(String host, int port, String user, String password, String dbName) {
        var url = "postgresql://" + user + ":" + password + "@" + host + ":" + port + "/" + dbName + "?sslmode=disable";
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
