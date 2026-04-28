package com.ethos.e2e;

import static org.junit.jupiter.api.Assertions.*;

import java.net.URI;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class AuthServerIntegrationTest extends E2ETestBase {

    private String uniqueEmail() {
        return "test-" + UUID.randomUUID() + "@example.com";
    }

    private HttpResponse<String> postToBackend(String path, String body, String jwt) throws Exception {
        var builder = HttpRequest.newBuilder()
                .uri(URI.create(APP_URL + path))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body));
        if (jwt != null) builder.header("Authorization", "Bearer " + jwt);
        return HTTP.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> getFromBackend(String path, String jwt) throws Exception {
        var builder = HttpRequest.newBuilder().uri(URI.create(APP_URL + path)).GET();
        if (jwt != null) builder.header("Authorization", "Bearer " + jwt);
        return HTTP.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> signInViaAuthServerDirect(String email, String password) throws Exception {
        var body = MAPPER.createObjectNode();
        var formFields = MAPPER.createArrayNode();
        formFields.add(createFormField("email", email));
        formFields.add(createFormField("password", password));
        body.set("formFields", formFields);

        return HTTP.send(
                HttpRequest.newBuilder()
                        .uri(URI.create(AUTH_URL + "/auth/signin"))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(MAPPER.writeValueAsString(body)))
                        .build(),
                HttpResponse.BodyHandlers.ofString());
    }

    @Nested
    class SignupAndRegister {

        @Test
        void signupThenRegister_createsUserInBackend() throws Exception {
            var email = uniqueEmail();
            var jwt = signUpViaAuthServer(email, "Password123!");

            var body = MAPPER.writeValueAsString(MAPPER.createObjectNode().put("displayName", "Test User"));
            var response = postToBackend("/users", body, jwt);

            assertEquals(201, response.statusCode());
            var parsed = MAPPER.readTree(response.body());
            assertEquals("Test User", parsed.get("displayName").asText());
            assertEquals(email, parsed.get("email").asText());
            assertNotNull(parsed.get("id").asText());
        }

        @Test
        void signupWithoutRegister_returns401OnProtectedRoutes() throws Exception {
            var email = uniqueEmail();
            var jwt = signUpViaAuthServer(email, "Password123!");

            var response = getFromBackend("/users/me", jwt);

            assertEquals(401, response.statusCode());
            assertTrue(response.body().contains("registration_incomplete"));
        }

        @Test
        void signupAndRegister_canAccessMultipleEndpointsWithSameToken() throws Exception {
            var email = uniqueEmail();
            var jwt = signUpViaAuthServer(email, "Password123!");

            var registerBody =
                    MAPPER.writeValueAsString(MAPPER.createObjectNode().put("displayName", "Alice"));
            var registerResponse = postToBackend("/users", registerBody, jwt);
            assertEquals(201, registerResponse.statusCode());

            var meResponse = getFromBackend("/users/me", jwt);
            assertEquals(200, meResponse.statusCode());
            assertEquals(
                    "Alice",
                    MAPPER.readTree(meResponse.body()).get("displayName").asText());

            var contactsResponse = getFromBackend("/contacts", jwt);
            assertEquals(200, contactsResponse.statusCode());
        }
    }

    @Nested
    class LoginAndAuthenticate {

        @Test
        void signinWithCorrectCredentials_returnsValidJwt() throws Exception {
            var email = uniqueEmail();
            signUpViaAuthServer(email, "Password123!");
            var jwt = signInViaAuthServer(email, "Password123!");

            assertNotNull(jwt);
            assertFalse(jwt.isBlank());
        }

        @Test
        void signinWithCorrectCredentials_tokenWorksOnBackend() throws Exception {
            var email = uniqueEmail();
            signUpViaAuthServer(email, "Password123!");
            var jwt = signInViaAuthServer(email, "Password123!");

            var registerBody =
                    MAPPER.writeValueAsString(MAPPER.createObjectNode().put("displayName", "Bob"));
            var registerResponse = postToBackend("/users", registerBody, jwt);
            assertEquals(201, registerResponse.statusCode());

            var meResponse = getFromBackend("/users/me", jwt);
            assertEquals(200, meResponse.statusCode());
        }

        @Test
        void signinWithWrongPassword_returnsWrongCredentialsError() throws Exception {
            var email = uniqueEmail();
            signUpViaAuthServer(email, "Password123!");

            var response = signInViaAuthServerDirect(email, "WrongPassword1!");

            assertEquals(200, response.statusCode());
            assertEquals(
                    "WRONG_CREDENTIALS_ERROR",
                    MAPPER.readTree(response.body()).get("status").asText());
        }
    }

    @Nested
    class AuthServerMeEndpoint {

        @Test
        void validToken_returnsUserId() throws Exception {
            var email = uniqueEmail();
            var jwt = signUpViaAuthServer(email, "Password123!");
            var supertokensUserId = getUserIdViaAuthServer(jwt);

            assertNotNull(supertokensUserId);
            assertFalse(supertokensUserId.isBlank());
        }

        @Test
        void validToken_usedOnBothAuthServerAndBackend() throws Exception {
            var email = uniqueEmail();
            signUpViaAuthServer(email, "Password123!");
            var jwt = signInViaAuthServer(email, "Password123!");

            var authServerUserId = getUserIdViaAuthServer(jwt);
            var registerBody =
                    MAPPER.writeValueAsString(MAPPER.createObjectNode().put("displayName", "Bob"));
            var registerResponse = postToBackend("/users", registerBody, jwt);

            assertEquals(201, registerResponse.statusCode());
            assertEquals(authServerUserId, getUserIdViaAuthServer(jwt));
        }

        @Test
        void invalidToken_returns401FromAuthServer() throws Exception {
            var response = HTTP.send(
                    HttpRequest.newBuilder()
                            .uri(URI.create(AUTH_URL + "/me"))
                            .header("Authorization", "Bearer not.a.real.token")
                            .GET()
                            .build(),
                    HttpResponse.BodyHandlers.ofString());

            assertEquals(401, response.statusCode());
        }

        @Test
        void noToken_returns401FromAuthServer() throws Exception {
            var response = HTTP.send(
                    HttpRequest.newBuilder()
                            .uri(URI.create(AUTH_URL + "/me"))
                            .GET()
                            .build(),
                    HttpResponse.BodyHandlers.ofString());

            assertEquals(401, response.statusCode());
        }
    }

    @Nested
    class InvalidTokenHandling {

        @Test
        void malformedToken_returns401OnBackend() throws Exception {
            var response = getFromBackend("/users/me", "not.valid.jwt");
            assertEquals(401, response.statusCode());
        }

        @Test
        void noAuthHeader_returns401OnBackend() throws Exception {
            var response = getFromBackend("/users/me", null);
            assertEquals(401, response.statusCode());
        }

        @Test
        void randomStringToken_returns401OnBackend() throws Exception {
            var response = getFromBackend("/users/me", "randomgarbage123");
            assertEquals(401, response.statusCode());
        }
    }
}
