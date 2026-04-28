import * as fs from "fs";
import { STATE_FILE } from "./jest.globalSetup";

const { url } = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) as {
    url: string;
};
process.env.SUPERTOKENS_URL = url;
