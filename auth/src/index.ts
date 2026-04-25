import "dotenv/config";
import { createApp } from "./app";

const {
  SUPERTOKENS_CORE_URL = "http://supertokens:3567",
  API_DOMAIN = "http://localhost:8080",
  WEBSITE_DOMAIN = "http://localhost:8080",
  PORT = "3568",
} = process.env;

const app = createApp({
  connectionURI: SUPERTOKENS_CORE_URL,
  apiDomain: API_DOMAIN,
  websiteDomain: WEBSITE_DOMAIN,
});

app.listen(parseInt(PORT), () => {
  console.log(`Auth server listening on port ${PORT}`);
});
