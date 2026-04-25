import { GenericContainer, Wait } from "testcontainers";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export const STATE_FILE = path.join(os.tmpdir(), "ethos-auth-test-state.json");

export default async function globalSetup() {
  const container = await new GenericContainer(
    "registry.supertokens.io/supertokens/supertokens-postgresql:11.4.4"
  )
    .withExposedPorts(3567)
    .withWaitStrategy(
      Wait.forHttp("/hello", 3567)
        .forStatusCode(200)
        .withStartupTimeout(120_000)
    )
    .start();

  const url = `http://${container.getHost()}:${container.getMappedPort(3567)}`;
  fs.writeFileSync(STATE_FILE, JSON.stringify({ url }));
}
