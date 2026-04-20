package com.ethos.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
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

    private final List<RSAPublicKey> publicKeys;

    public JwtVerifier(List<RSAPublicKey> publicKeys) {
        this.publicKeys = publicKeys;
    }

    public static JwtVerifier fromJwksUrl(String jwksUrl) {
        try {
            var client = HttpClient.newHttpClient();
            var request = HttpRequest.newBuilder().uri(URI.create(jwksUrl)).build();
            var response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return new JwtVerifier(parseJwks(response.body()));
        } catch (Exception e) {
            throw new RuntimeException("Failed to load JWKS from " + jwksUrl, e);
        }
    }

    public JwtClaims verify(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new JwtException("Missing or invalid Authorization header");
        }
        var token = authorizationHeader.substring(7);

        Exception lastException = null;
        for (var key : publicKeys) {
            try {
                var claims = Jwts.parser()
                        .verifyWith(key)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

                var sub = claims.getSubject();
                if (sub == null) {
                    throw new JwtException("Token missing sub claim");
                }
                var email = claims.get("email", String.class);
                return new JwtClaims(sub, email);
            } catch (Exception e) {
                lastException = e;
            }
        }
        throw new JwtException("JWT verification failed", lastException);
    }

    private static List<RSAPublicKey> parseJwks(String jwksJson) throws Exception {
        var mapper = new ObjectMapper();
        var root = mapper.readTree(jwksJson);
        var keys = new ArrayList<RSAPublicKey>();

        for (var keyNode : root.get("keys")) {
            if (!"RSA".equals(keyNode.get("kty").asText())) continue;
            if (keyNode.has("use") && !"sig".equals(keyNode.get("use").asText())) continue;

            var n = Base64.getUrlDecoder().decode(keyNode.get("n").asText());
            var e = Base64.getUrlDecoder().decode(keyNode.get("e").asText());

            var spec = new RSAPublicKeySpec(new BigInteger(1, n), new BigInteger(1, e));
            keys.add((RSAPublicKey) KeyFactory.getInstance("RSA").generatePublic(spec));
        }
        return keys;
    }
}
