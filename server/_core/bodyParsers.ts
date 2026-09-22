import express, { type Express } from "express";

const LARGE_BODY_PROCEDURES = new Set(["visitorSubmissions.submit"]);

// Registers JSON/urlencoded body parsers with a small default size limit,
// raising the limit only for tRPC procedures that legitimately need larger
// payloads (e.g. file attachments), inferred from the last path segment.
export function registerBodyParsers(app: Express) {
  const standardJson = express.json({ limit: "2mb" });
  const attachmentJson = express.json({ limit: "50mb" });
  app.use((req, res, next) => {
    const procedures = req.path.split("/").at(-1)?.split(",") ?? [];
    const parser = procedures.some(procedure =>
      LARGE_BODY_PROCEDURES.has(procedure)
    )
      ? attachmentJson
      : standardJson;
    return parser(req, res, next);
  });
  app.use(express.urlencoded({ limit: "256kb", extended: true }));
}
