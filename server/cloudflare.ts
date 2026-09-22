import express from "express";
import { createServer } from "node:http";
import { httpServerHandler } from "cloudflare:node";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { createContext } from "./_core/context";
import { sdk } from "./_core/sdk";
import { appRouter } from "./routers";
import { runPeriodicDevelopmentDraft } from "./periodicDevelopment";
import { registerBodyParsers } from "./_core/bodyParsers";

const app = express();

registerBodyParsers(app);
registerStorageProxy(app);
registerOAuthRoutes(app);

app.post("/api/scheduled/periodic-development", async (req, res) => {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user?.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    return res.json(await runPeriodicDevelopmentDraft(user.taskUid));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message, timestamp: new Date().toISOString(), context: { path: req.path } });
  }
});

app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

const server = createServer(app);
server.listen(8080);

export default httpServerHandler({ port: 8080 });
