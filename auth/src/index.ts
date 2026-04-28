import "dotenv/config";
import { initSupertokens, createApp } from "./app";

const {
    SUPERTOKENS_URL = "http://supertokens:3567",
    API_URL = "http://localhost:8080",
    AUTH_URL = "http://localhost:3568",
    PORT = "3568",
} = process.env;

initSupertokens({
    connectionURI: SUPERTOKENS_URL,
    apiDomain: API_URL,
    websiteDomain: AUTH_URL,
});

const app = createApp(AUTH_URL);

app.listen(parseInt(PORT), () => {
    console.log(`Auth server listening on port ${PORT}`);
});
