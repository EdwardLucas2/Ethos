package com.ethos.auth;

import static org.junit.jupiter.api.Assertions.*;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Date;
import java.util.List;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class JwtVerifierTest {

    private static RSAPublicKey publicKey;
    private static RSAPrivateKey privateKey;
    private static JwtVerifier verifier;

    @BeforeAll
    static void setUpKeys() throws Exception {
        var kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        var kp = kpg.generateKeyPair();
        publicKey = (RSAPublicKey) kp.getPublic();
        privateKey = (RSAPrivateKey) kp.getPrivate();
        verifier = new JwtVerifier(List.of(publicKey));
    }

    private static String buildToken(String subject, String email, Date expiration) {
        var builder = Jwts.builder().expiration(expiration).signWith(privateKey);
        if (subject != null) builder.subject(subject);
        if (email != null) builder.claim("email", email);
        return builder.compact();
    }

    @Nested
    class Verify {

        @Test
        void givenValidToken_returnsClaims() {
            var expiry = new Date(System.currentTimeMillis() + 3_600_000);
            var token = buildToken("st-user-123", "alice@example.com", expiry);

            var claims = verifier.verify("Bearer " + token);

            assertEquals("st-user-123", claims.supertokensUserId());
            assertEquals("alice@example.com", claims.email());
        }

        @Test
        void givenExpiredToken_throws() {
            var expiry = new Date(System.currentTimeMillis() - 1_000);
            var token = buildToken("st-user-123", "alice@example.com", expiry);

            assertThrows(JwtException.class, () -> verifier.verify("Bearer " + token));
        }

        @Test
        void givenTokenSignedWithUnknownKey_throws() throws Exception {
            var kpg = KeyPairGenerator.getInstance("RSA");
            kpg.initialize(2048);
            var otherPrivateKey = (RSAPrivateKey) kpg.generateKeyPair().getPrivate();

            var expiry = new Date(System.currentTimeMillis() + 3_600_000);
            var token = Jwts.builder()
                    .subject("st-user-123")
                    .claim("email", "alice@example.com")
                    .expiration(expiry)
                    .signWith(otherPrivateKey)
                    .compact();

            assertThrows(JwtException.class, () -> verifier.verify("Bearer " + token));
        }

        @Test
        void givenMissingBearerPrefix_throws() {
            var expiry = new Date(System.currentTimeMillis() + 3_600_000);
            var token = buildToken("st-user-123", "alice@example.com", expiry);

            assertThrows(JwtException.class, () -> verifier.verify(token));
        }

        @Test
        void givenNullHeader_throws() {
            assertThrows(JwtException.class, () -> verifier.verify(null));
        }

        @Test
        void givenTokenMissingSubClaim_throws() {
            var expiry = new Date(System.currentTimeMillis() + 3_600_000);
            // buildToken with null subject omits the sub claim
            var token = buildToken(null, "alice@example.com", expiry);

            assertThrows(JwtException.class, () -> verifier.verify("Bearer " + token));
        }
    }
}
