package com.ethos.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.SignatureException;
import java.math.BigInteger;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.KeyFactory;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

public class JwtVerifier {

    private final String jwksUrl;
    private volatile List<RSAPublicKey> publicKeys;

    JwtVerifier(String jwksUrl, List<RSAPublicKey> publicKeys) {
        this.jwksUrl = jwksUrl;
        this.publicKeys = publicKeys;
    }

    public static JwtVerifier fromJwksUrl(String jwksUrl) {
        try {
            return new JwtVerifier(jwksUrl, fetchKeys(jwksUrl));
        } catch (Exception e) {
            throw new RuntimeException("Failed to load JWKS from " + jwksUrl, e);
        }
    }

    public JwtClaims verify(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new JwtException("Missing or invalid Authorization header");
        }
        String token = authorizationHeader.substring("Bearer ".length());

        VerifyResult result = attemptVerify(token, publicKeys);
        if (result.succeeded()) return result.claims();

        // Signature failure may indicate key rotation — refresh keys once and retry
        if (result.lastException() instanceof SignatureException) {
            refreshKeys();
            VerifyResult retry = attemptVerify(token, publicKeys);
            if (retry.succeeded()) return retry.claims();
            throw new JwtException("JWT verification failed after key refresh", retry.lastException());
        }

        throw new JwtException("JWT verification failed", result.lastException());
    }

    private synchronized void refreshKeys() {
        if (jwksUrl == null || jwksUrl.isBlank()) return;
        try {
            publicKeys = fetchKeys(jwksUrl);
        } catch (Exception ignored) {
            // Leave existing keys in place if the refresh fails
        }
    }

    private static VerifyResult attemptVerify(String token, List<RSAPublicKey> keys) {
        Exception lastException = null;
        for (RSAPublicKey key : keys) {
            try {
                Claims claims = Jwts.parser()
                        .verifyWith(key)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();
                String sub = claims.getSubject();
                if (sub == null) throw new JwtException("Token missing sub claim");
                String email = claims.get("email", String.class);
                return new VerifyResult(new JwtClaims(sub, email), null);
            } catch (Exception e) {
                lastException = e;
            }
        }
        return new VerifyResult(null, lastException);
    }

    private static List<RSAPublicKey> fetchKeys(String jwksUrl) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder().uri(URI.create(jwksUrl)).build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        return parseJwks(response.body());
    }

    private static List<RSAPublicKey> parseJwks(String jwksJson) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(jwksJson);
        List<RSAPublicKey> keys = new ArrayList<>();

        for (JsonNode keyNode : root.get("keys")) {
            if (!"RSA".equals(keyNode.get("kty").asText())) continue;
            if (keyNode.has("use") && !"sig".equals(keyNode.get("use").asText())) continue;

            byte[] n = Base64.getUrlDecoder().decode(keyNode.get("n").asText());
            byte[] e = Base64.getUrlDecoder().decode(keyNode.get("e").asText());

            RSAPublicKeySpec spec = new RSAPublicKeySpec(new BigInteger(1, n), new BigInteger(1, e));
            keys.add((RSAPublicKey) KeyFactory.getInstance("RSA").generatePublic(spec));
        }
        return keys;
    }

    private record VerifyResult(JwtClaims claims, Exception lastException) {
        boolean succeeded() {
            return claims != null;
        }
    }
}
