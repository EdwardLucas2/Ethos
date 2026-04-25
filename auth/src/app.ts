import express, { Request, Response } from "express";
import cors from "cors";
import supertokens, { getUser } from "supertokens-node";
import {
    middleware,
    errorHandler,
    SessionRequest,
} from "supertokens-node/framework/express";
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import Session from "supertokens-node/recipe/session";
import EmailPassword from "supertokens-node/recipe/emailpassword";

export interface AppConfig {
    connectionURI: string;
    apiDomain: string;
    websiteDomain: string;
}

export function initSupertokens(config: AppConfig): void {
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
                override: {
                    functions: (originalImplementation) => ({
                        ...originalImplementation,
                        createNewSession: async (input) => {
                            // Include email in the access token so the Java backend
                            // can extract it during user registration (POST /users).
                            const user = await getUser(input.userId);
                            input.accessTokenPayload = {
                                ...input.accessTokenPayload,
                                email: user?.emails[0] ?? null,
                            };
                            return originalImplementation.createNewSession(input);
                        },
                    }),
                },
            }),
        ],
    });
}

export function createApp(websiteDomain: string): express.Application {
    const app = express();

    app.use(
        cors({
            origin: websiteDomain,
            allowedHeaders: [
                "content-type",
                ...supertokens.getAllCORSHeaders(),
            ],
            credentials: true,
        })
    );

    app.use(middleware());

    app.get("/health", (_req: Request, res: Response) => {
        res.status(200).json({ status: "ok" });
    });

    // verifySession() guarantees req.session is set when this handler runs
    app.get("/me", verifySession(), (req: SessionRequest, res: Response) => {
        res.json({ userId: req.session!.getUserId() });
    });

    app.use(errorHandler());

    return app;
}
