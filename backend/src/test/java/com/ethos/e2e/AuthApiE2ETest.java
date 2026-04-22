package com.ethos.e2e;

import static org.junit.jupiter.api.Assertions.*;

import java.net.URI;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class AuthApiE2ETest extends E2ETestBase {

    private HttpResponse<String> signup(String email, String password) throws Exception {
        var body = MAPPER.writeValueAsString(
                MAPPER.createObjectNode().put("email", email).put("password", password));
        var request = HttpRequest.newBuilder()
                .uri(URI.create(APP_URL + "/auth/signup"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        return HTTP.send(request, HttpResponse.BodyHandlers.ofString());
    }

    @Nested
    class Signup {

        @Test
        void givenValidCredentials_returns201WithAccessToken() throws Exception {
            var response = signup("newuser@example.com", "Test1234!");

            assertEquals(201, response.statusCode());
            var body = MAPPER.readTree(response.body());
            assertNotNull(body.get("accessToken"));
            assertFalse(body.get("accessToken").asText().isBlank());
        }

        @Test
        void givenDuplicateEmail_returns409() throws Exception {
            signup("duplicate@example.com", "Test1234!");

            var response = signup("duplicate@example.com", "Test1234!");

            assertEquals(409, response.statusCode());
        }

        @Test
        void givenBlankEmail_returns400() throws Exception {
            var response = signup("", "Test1234!");

            assertEquals(400, response.statusCode());
        }

        @Test
        void givenBlankPassword_returns400() throws Exception {
            var response = signup("user@example.com", "");

            assertEquals(400, response.statusCode());
        }

        @Test
        void givenWeakPassword_returns400() throws Exception {
            var response = signup("user@example.com", "weak");

            assertEquals(400, response.statusCode());
        }
    }
}
