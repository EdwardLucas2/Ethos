package com.ethos.e2e;

import static org.junit.jupiter.api.Assertions.*;

import java.net.URI;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class UserApiE2ETest extends E2ETestBase {

    private HttpResponse<String> get(String path, String jwt) throws Exception {
        var builder = HttpRequest.newBuilder().uri(URI.create(APP_URL + path)).GET();
        if (jwt != null) builder.header("Authorization", "Bearer " + jwt);
        return HTTP.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> post(String path, String body, String jwt) throws Exception {
        var builder = HttpRequest.newBuilder()
                .uri(URI.create(APP_URL + path))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body));
        if (jwt != null) builder.header("Authorization", "Bearer " + jwt);
        return HTTP.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> patch(String path, String body, String jwt) throws Exception {
        var builder = HttpRequest.newBuilder()
                .uri(URI.create(APP_URL + path))
                .header("Content-Type", "application/json")
                .method("PATCH", HttpRequest.BodyPublishers.ofString(body));
        if (jwt != null) builder.header("Authorization", "Bearer " + jwt);
        return HTTP.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> delete(String path, String jwt) throws Exception {
        var builder = HttpRequest.newBuilder().uri(URI.create(APP_URL + path)).DELETE();
        if (jwt != null) builder.header("Authorization", "Bearer " + jwt);
        return HTTP.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    @Nested
    class HealthEndpoint {

        @Test
        void givenNoAuth_returns200() throws Exception {
            var response = get("/health", null);

            assertEquals(200, response.statusCode());
            assertEquals("OK", response.body());
        }
    }

    @Nested
    class RegisterUser {

        @Test
        void givenValidJwt_returns201WithCorrectBody() throws Exception {
            var jwt = signupAndGetJwt();
            var email = extractEmailFromJwt(jwt);
            var body = MAPPER.writeValueAsString(MAPPER.createObjectNode().put("displayName", "Alice"));

            var response = post("/users", body, jwt);

            assertEquals(201, response.statusCode());
            var parsed = MAPPER.readTree(response.body());
            assertEquals("Alice", parsed.get("displayName").asText());
            assertEquals(email, parsed.get("email").asText());
            assertNotNull(parsed.get("id").asText());
            assertTrue(parsed.get("tag").asText().startsWith("alice"));
            assertFalse(parsed.has("avatarUrl"));
        }

        @Test
        void givenValidJwt_persistsUserToDatabase() throws Exception {
            var jwt = signupAndGetJwt();
            var email = extractEmailFromJwt(jwt);
            var body = MAPPER.writeValueAsString(MAPPER.createObjectNode().put("displayName", "Bob"));

            post("/users", body, jwt);

            var count = JDBI.withHandle(h -> h.createQuery("SELECT COUNT(*) FROM users WHERE email = :email")
                    .bind("email", email)
                    .mapTo(Long.class)
                    .one());
            assertEquals(1L, count);
        }

        @Test
        void givenNoAuthorizationHeader_returns401() throws Exception {
            var body = MAPPER.writeValueAsString(MAPPER.createObjectNode().put("displayName", "Alice"));

            var response = post("/users", body, null);

            assertEquals(401, response.statusCode());
        }

        @Test
        void givenMalformedJwt_returns401() throws Exception {
            var body = MAPPER.writeValueAsString(MAPPER.createObjectNode().put("displayName", "Alice"));

            var response = post("/users", body, "not.a.real.token");

            assertEquals(401, response.statusCode());
        }

        @Test
        void givenMissingDisplayName_returns400() throws Exception {
            var jwt = signupAndGetJwt();
            var body = MAPPER.writeValueAsString(MAPPER.createObjectNode());

            var response = post("/users", body, jwt);

            assertEquals(400, response.statusCode());
        }

        @Test
        void givenBlankDisplayName_returns400() throws Exception {
            var jwt = signupAndGetJwt();
            var body = MAPPER.writeValueAsString(MAPPER.createObjectNode().put("displayName", "   "));

            var response = post("/users", body, jwt);

            assertEquals(400, response.statusCode());
        }

        @Test
        void givenAlreadyRegistered_returns409() throws Exception {
            var jwt = registerAndGetJwt("Eve");
            var body = MAPPER.writeValueAsString(MAPPER.createObjectNode().put("displayName", "Eve"));

            var response = post("/users", body, jwt);

            assertEquals(409, response.statusCode());
        }
    }

    @Nested
    class GetMe {

        @Test
        void givenRegisteredUser_returns200WithProfile() throws Exception {
            var jwt = registerAndGetJwt("Alice");
            var email = extractEmailFromJwt(jwt);

            var response = get("/users/me", jwt);

            assertEquals(200, response.statusCode());
            var parsed = MAPPER.readTree(response.body());
            assertEquals("Alice", parsed.get("displayName").asText());
            assertEquals(email, parsed.get("email").asText());
            assertNotNull(parsed.get("id").asText());
        }

        @Test
        void givenNoAuth_returns401() throws Exception {
            var response = get("/users/me", null);

            assertEquals(401, response.statusCode());
        }

        @Test
        void givenJwtWithNoUsersRow_returns401WithRegistrationIncomplete() throws Exception {
            var jwt = signupAndGetJwt();

            var response = get("/users/me", jwt);

            assertEquals(401, response.statusCode());
            assertTrue(response.body().contains("registration_incomplete"));
        }
    }

    @Nested
    class UpdateMe {

        @Test
        void givenValidDisplayName_returns200WithUpdatedProfile() throws Exception {
            var jwt = registerAndGetJwt("Alice");
            var body = MAPPER.writeValueAsString(MAPPER.createObjectNode().put("displayName", "Alice Updated"));

            var response = patch("/users/me", body, jwt);

            assertEquals(200, response.statusCode());
            assertEquals(
                    "Alice Updated",
                    MAPPER.readTree(response.body()).get("displayName").asText());
        }

        @Test
        void givenBlankDisplayName_returns400() throws Exception {
            var jwt = registerAndGetJwt("Alice");
            var body = MAPPER.writeValueAsString(MAPPER.createObjectNode().put("displayName", "  "));

            var response = patch("/users/me", body, jwt);

            assertEquals(400, response.statusCode());
        }

        @Test
        void givenNoAuth_returns401() throws Exception {
            var body = MAPPER.writeValueAsString(MAPPER.createObjectNode().put("displayName", "X"));

            var response = patch("/users/me", body, null);

            assertEquals(401, response.statusCode());
        }
    }

    @Nested
    class SearchUsers {

        @Test
        void givenMatchingPrefix_returnsResults() throws Exception {
            var jwt = registerAndGetJwt("Alice");
            registerAndGetJwt("Bob");

            var response = get("/users/search?tag=bob", jwt);

            assertEquals(200, response.statusCode());
            var parsed = MAPPER.readTree(response.body());
            assertEquals(1, parsed.size());
            assertTrue(parsed.get(0).get("tag").asText().startsWith("bob"));
        }

        @Test
        void givenContactInResults_isContactIsTrue() throws Exception {
            var aliceJwt = registerAndGetJwt("Alice");
            var bobJwt = registerAndGetJwt("Bob");
            var bobId = getUserIdFromJwt(bobJwt);
            post(
                    "/contacts",
                    MAPPER.writeValueAsString(MAPPER.createObjectNode().put("targetUserId", bobId.toString())),
                    aliceJwt);

            var response = get("/users/search?tag=bob", aliceJwt);

            assertEquals(200, response.statusCode());
            assertTrue(MAPPER.readTree(response.body()).get(0).get("isContact").asBoolean());
        }

        @Test
        void givenCallerInResults_excludesSelf() throws Exception {
            var jwt = registerAndGetJwt("Alice");

            var response = get("/users/search?tag=alice", jwt);

            assertEquals(200, response.statusCode());
            assertEquals(0, MAPPER.readTree(response.body()).size());
        }

        @Test
        void givenTagParamTooShort_returns400() throws Exception {
            var jwt = registerAndGetJwt("Alice");

            assertEquals(400, get("/users/search?tag=a", jwt).statusCode());
        }

        @Test
        void givenMissingTagParam_returns400() throws Exception {
            var jwt = registerAndGetJwt("Alice");

            assertEquals(400, get("/users/search", jwt).statusCode());
        }

        @Test
        void givenNoAuth_returns401() throws Exception {
            assertEquals(401, get("/users/search?tag=bo", null).statusCode());
        }
    }

    @Nested
    class ListContacts {

        @Test
        void givenNoContacts_returnsEmptyList() throws Exception {
            var jwt = registerAndGetJwt("Alice");

            var response = get("/contacts", jwt);

            assertEquals(200, response.statusCode());
            assertEquals(0, MAPPER.readTree(response.body()).size());
        }

        @Test
        void givenContacts_returnsListWithoutEmail() throws Exception {
            var aliceJwt = registerAndGetJwt("Alice");
            var bobJwt = registerAndGetJwt("Bob");
            var bobId = getUserIdFromJwt(bobJwt);
            post(
                    "/contacts",
                    MAPPER.writeValueAsString(MAPPER.createObjectNode().put("targetUserId", bobId.toString())),
                    aliceJwt);

            var response = get("/contacts", aliceJwt);

            assertEquals(200, response.statusCode());
            var parsed = MAPPER.readTree(response.body());
            assertEquals(1, parsed.size());
            assertEquals("Bob", parsed.get(0).get("displayName").asText());
            assertFalse(parsed.get(0).has("email"));
        }

        @Test
        void givenNoAuth_returns401() throws Exception {
            assertEquals(401, get("/contacts", null).statusCode());
        }
    }

    @Nested
    class AddContact {

        @Test
        void givenValidUser_returns201WithContactData() throws Exception {
            var aliceJwt = registerAndGetJwt("Alice");
            var bobJwt = registerAndGetJwt("Bob");
            var bobId = getUserIdFromJwt(bobJwt);
            var body = MAPPER.writeValueAsString(MAPPER.createObjectNode().put("targetUserId", bobId.toString()));

            var response = post("/contacts", body, aliceJwt);

            assertEquals(201, response.statusCode());
            var parsed = MAPPER.readTree(response.body());
            assertEquals("Bob", parsed.get("displayName").asText());
            assertFalse(parsed.has("email"));
        }

        @Test
        void givenSelfAdd_returns400() throws Exception {
            var aliceJwt = registerAndGetJwt("Alice");
            var aliceId = getUserIdFromJwt(aliceJwt);
            var body = MAPPER.writeValueAsString(MAPPER.createObjectNode().put("targetUserId", aliceId.toString()));

            assertEquals(400, post("/contacts", body, aliceJwt).statusCode());
        }

        @Test
        void givenUnknownUser_returns404() throws Exception {
            var jwt = registerAndGetJwt("Alice");
            var body = MAPPER.writeValueAsString(
                    MAPPER.createObjectNode().put("targetUserId", UUID.randomUUID().toString()));

            assertEquals(404, post("/contacts", body, jwt).statusCode());
        }

        @Test
        void givenAlreadyContact_returns409() throws Exception {
            var aliceJwt = registerAndGetJwt("Alice");
            var bobJwt = registerAndGetJwt("Bob");
            var bobId = getUserIdFromJwt(bobJwt);
            var body = MAPPER.writeValueAsString(MAPPER.createObjectNode().put("targetUserId", bobId.toString()));
            post("/contacts", body, aliceJwt);

            assertEquals(409, post("/contacts", body, aliceJwt).statusCode());
        }

        @Test
        void givenNoAuth_returns401() throws Exception {
            var body = MAPPER.writeValueAsString(
                    MAPPER.createObjectNode().put("targetUserId", UUID.randomUUID().toString()));

            assertEquals(401, post("/contacts", body, null).statusCode());
        }
    }

    @Nested
    class RemoveContact {

        @Test
        void givenExistingContact_returns204AndContactIsGone() throws Exception {
            var aliceJwt = registerAndGetJwt("Alice");
            var bobJwt = registerAndGetJwt("Bob");
            var bobId = getUserIdFromJwt(bobJwt);
            post(
                    "/contacts",
                    MAPPER.writeValueAsString(MAPPER.createObjectNode().put("targetUserId", bobId.toString())),
                    aliceJwt);

            var response = delete("/contacts/" + bobId, aliceJwt);

            assertEquals(204, response.statusCode());
            assertEquals(0, MAPPER.readTree(get("/contacts", aliceJwt).body()).size());
        }

        @Test
        void givenNotInContacts_returns404() throws Exception {
            var jwt = registerAndGetJwt("Alice");
            var bobJwt = registerAndGetJwt("Bob");
            var bobId = getUserIdFromJwt(bobJwt);

            assertEquals(404, delete("/contacts/" + bobId, jwt).statusCode());
        }

        @Test
        void givenNoAuth_returns401() throws Exception {
            assertEquals(401, delete("/contacts/" + UUID.randomUUID(), null).statusCode());
        }
    }
}
