package com.ethos.auth;

import com.ethos.exception.BadRequestException;
import com.ethos.exception.ConflictException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class SuperTokensCoreClient {

    private final String baseUrl;
    private final HttpClient http;
    private final ObjectMapper mapper;

    public SuperTokensCoreClient(String baseUrl) {
        this.baseUrl = baseUrl;
        this.http = HttpClient.newHttpClient();
        this.mapper = new ObjectMapper();
    }

    public String signUp(String email, String password) {
        var body = mapper.createObjectNode();
        body.put("email", email);
        body.put("password", password);

        var json = post("/recipe/emailpassword/signup", body);
        return switch (json.get("status").asText()) {
            case "OK" -> json.get("user").get("id").asText();
            case "EMAIL_ALREADY_EXISTS_ERROR" -> throw new ConflictException("Email already registered");
            case "FIELD_ERROR" ->
                throw new BadRequestException(
                        json.get("formFields").get(0).get("error").asText());
            default ->
                throw new RuntimeException(
                        "Unexpected SuperTokens status: " + json.get("status").asText());
        };
    }

    public String createSession(String userId, String email) {
        var userDataInJWT = mapper.createObjectNode();
        userDataInJWT.put("email", email);

        var body = mapper.createObjectNode();
        body.put("userId", userId);
        body.put("enableAntiCsrf", false);
        body.set("userDataInJWT", userDataInJWT);
        body.set("userDataInDatabase", mapper.createObjectNode());

        var json = post("/recipe/session", body);
        return json.get("accessToken").get("token").asText();
    }

    private JsonNode post(String path, ObjectNode body) {
        try {
            var request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + path))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                    .build();
            var response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("SuperTokens CDI call to " + path + " failed: " + response.statusCode() + " "
                        + response.body());
            }
            return mapper.readTree(response.body());
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to call SuperTokens CDI at " + path, e);
        }
    }
}
