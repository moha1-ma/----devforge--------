import express, { type Express } from "express";

const LARGE_BODY_PROCEDURES = new Set(["visitorSubmissions.submit"]);

export function registerBodyParsers(app: Express) {
  const standardJson = express.json({ limit: "2mb" });
  const attachmentJson = express.json({ limit: "50mb" });
  app.use((req, res, next) => {
    const procedures = req.path.split("/").at(-1)?.split(",") ?? [];
    const parser = procedures.some(procedure => LARGE_BODY_PROCEDURES.has(procedure)) ? attachmentJson : standardJson;
    return parser(req, res, next);
  });
  app.use(express.urlencoded({ limit: "256kb", extended: true }));
}
