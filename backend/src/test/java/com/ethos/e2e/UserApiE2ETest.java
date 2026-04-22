package com.ethos.e2e;

import static org.junit.jupiter.api.Assertions.*;

import java.net.URI;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class UserApiE2ETest extends E2ETestBase {

    private HttpResponse<String> get(String path) throws Exception {
        var req = HttpRequest.newBuilder().uri(URI.create(APP_URL + path)).GET().build();
        return HTTP.send(req, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> post(String path, String body, String authHeader) throws Exception {
        var builder = HttpRequest.newBuilder()
                .uri(URI.create(APP_URL + path))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body));
        if (authHeader != null) builder.header("Authorization", authHeader);
        return HTTP.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private String registerBody(String displayName) throws Exception {
        return MAPPER.writeValueAsString(MAPPER.createObjectNode().put("displayName", displayName));
    }

    @Nested
    class HealthEndpoint {

        @Test
        void givenNoAuth_returns200() throws Exception {
            var response = get("/health");

            assertEquals(200, response.statusCode());
            assertEquals("OK", response.body());
        }
    }

    @Nested
    class RegisterUser {

        @Test
        void givenValidJwt_returns201WithCorrectBody() throws Exception {
            var email = "alice@example.com";
            var jwt = signupAndGetJwt(email);

            var response = post("/users", registerBody("Alice"), "Bearer " + jwt);

            assertEquals(201, response.statusCode());
            var body = MAPPER.readTree(response.body());
            assertEquals("Alice", body.get("displayName").asText());
            assertEquals(email, body.get("email").asText());
            assertNotNull(body.get("id").asText());
            assertTrue(body.get("tag").asText().startsWith("alice"));
            assertFalse(body.has("avatarUrl"));
        }

        @Test
        void givenValidJwt_persistsUserToDatabase() throws Exception {
            var email = "bob@example.com";
            var jwt = signupAndGetJwt(email);

            post("/users", registerBody("Bob"), "Bearer " + jwt);

            var count = JDBI.withHandle(h -> h.createQuery("SELECT COUNT(*) FROM users WHERE email = :email")
                    .bind("email", email)
                    .mapTo(Long.class)
                    .one());
            assertEquals(1L, count);
        }

        @Test
        void givenNoAuthorizationHeader_returns401() throws Exception {
            var response = post("/users", registerBody("Alice"), null);

            assertEquals(401, response.statusCode());
        }

        @Test
        void givenMalformedJwt_returns401() throws Exception {
            var response = post("/users", registerBody("Alice"), "Bearer not.a.real.token");

            assertEquals(401, response.statusCode());
        }

        @Test
        void givenMissingDisplayName_returns400() throws Exception {
            var jwt = signupAndGetJwt("carol@example.com");
            var body = MAPPER.writeValueAsString(MAPPER.createObjectNode());

            var response = post("/users", body, "Bearer " + jwt);

            assertEquals(400, response.statusCode());
        }

        @Test
        void givenBlankDisplayName_returns400() throws Exception {
            var jwt = signupAndGetJwt("dave@example.com");

            var response = post("/users", registerBody("   "), "Bearer " + jwt);

            assertEquals(400, response.statusCode());
        }

        @Test
        void givenAlreadyRegistered_returns409() throws Exception {
            var jwt = signupAndGetJwt("eve@example.com");

            post("/users", registerBody("Eve"), "Bearer " + jwt);
            var secondResponse = post("/users", registerBody("Eve"), "Bearer " + jwt);

            assertEquals(409, secondResponse.statusCode());
        }
    }
}
