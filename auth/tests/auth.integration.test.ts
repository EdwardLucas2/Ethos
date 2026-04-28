import request from "supertest";
import { initSupertokens, createApp } from "../src/app";

const websiteDomain = "http://localhost:3568";

initSupertokens({
    connectionURI: process.env.SUPERTOKENS_URL!,
    apiDomain: websiteDomain,
    websiteDomain,
});

const app = createApp(websiteDomain);

const uniqueEmail = () =>
    `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

describe("GET /health", () => {
    it("returns 200 with status ok", async () => {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: "ok" });
    });
});

describe("POST /auth/signup", () => {
    it("signs up successfully and returns header tokens, not cookies", async () => {
        const res = await request(app)
            .post("/auth/signup")
            .send({
                formFields: [
                    { id: "email", value: uniqueEmail() },
                    { id: "password", value: "Password123!" },
                ],
            });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("OK");
        expect(res.headers["st-access-token"]).toBeDefined();
        expect(res.headers["st-refresh-token"]).toBeDefined();
        expect(res.headers["set-cookie"]).toBeUndefined();
    });

    it("returns FIELD_ERROR on duplicate email", async () => {
        const email = uniqueEmail();
        await request(app)
            .post("/auth/signup")
            .send({
                formFields: [
                    { id: "email", value: email },
                    { id: "password", value: "Password123!" },
                ],
            });

        const res = await request(app)
            .post("/auth/signup")
            .send({
                formFields: [
                    { id: "email", value: email },
                    { id: "password", value: "Password123!" },
                ],
            });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("FIELD_ERROR");
        expect(res.body.formFields).toEqual(
            expect.arrayContaining([expect.objectContaining({ id: "email" })])
        );
    });
});

describe("POST /auth/signin", () => {
    it("signs in with valid credentials and returns header tokens", async () => {
        const email = uniqueEmail();
        await request(app)
            .post("/auth/signup")
            .send({
                formFields: [
                    { id: "email", value: email },
                    { id: "password", value: "Password123!" },
                ],
            });

        const res = await request(app)
            .post("/auth/signin")
            .send({
                formFields: [
                    { id: "email", value: email },
                    { id: "password", value: "Password123!" },
                ],
            });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("OK");
        expect(res.headers["st-access-token"]).toBeDefined();
        expect(res.headers["st-refresh-token"]).toBeDefined();
        expect(res.headers["set-cookie"]).toBeUndefined();
    });

    it("returns WRONG_CREDENTIALS_ERROR with bad password", async () => {
        const email = uniqueEmail();
        await request(app)
            .post("/auth/signup")
            .send({
                formFields: [
                    { id: "email", value: email },
                    { id: "password", value: "Password123!" },
                ],
            });

        const res = await request(app)
            .post("/auth/signin")
            .send({
                formFields: [
                    { id: "email", value: email },
                    { id: "password", value: "WrongPassword1!" },
                ],
            });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("WRONG_CREDENTIALS_ERROR");
    });
});

describe("GET /me (session verification)", () => {
    it("returns 401 without a token", async () => {
        const res = await request(app).get("/me");
        expect(res.status).toBe(401);
    });

    it("returns 200 with userId when a valid st-access-token is provided", async () => {
        const signUpRes = await request(app)
            .post("/auth/signup")
            .send({
                formFields: [
                    { id: "email", value: uniqueEmail() },
                    { id: "password", value: "Password123!" },
                ],
            });

        const accessToken = signUpRes.headers["st-access-token"] as string;

        const res = await request(app)
            .get("/me")
            .set("Authorization", `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.userId).toBeDefined();
    });
});
