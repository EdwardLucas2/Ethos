import express, { Request, Response } from "express";
import cors from "cors";
import supertokens from "supertokens-node";
import { middleware, errorHandler, SessionRequest } from "supertokens-node/framework/express";
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import Session from "supertokens-node/recipe/session";
import EmailPassword from "supertokens-node/recipe/emailpassword";

interface AppConfig {
  connectionURI: string;
  apiDomain: string;
  websiteDomain: string;
}

export function createApp(config: AppConfig): express.Application {
  supertokens.init({
    framework: "express",
    supertokens: {
      connectionURI: config.connectionURI,
    },
    appInfo: {
      appName: "Ethos",
      apiDomain: config.apiDomain,
      websiteDomain: config.websiteDomain,
      apiBasePath: "/auth",
      websiteBasePath: "/auth",
    },
    recipeList: [
      EmailPassword.init(),
      Session.init({
        getTokenTransferMethod: () => "header",
      }),
    ],
  });

  const app = express();

  app.use(
    cors({
      origin: config.websiteDomain,
      allowedHeaders: ["content-type", ...supertokens.getAllCORSHeaders()],
      credentials: true,
    })
  );

  app.use(middleware());

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  app.get("/me", verifySession(), (req: SessionRequest, res: Response) => {
    res.json({ userId: req.session!.getUserId() });
  });

  app.use(errorHandler());

  return app;
}
