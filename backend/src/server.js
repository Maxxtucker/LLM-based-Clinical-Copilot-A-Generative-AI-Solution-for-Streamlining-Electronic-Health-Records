// server/src/server.js
require("dotenv").config();

const mongoose = require("mongoose");
mongoose.set("debug", true);

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const { connectToDB } = require("./core/config/db");
const { connection } = require("mongoose");
const exphbs = require("express-handlebars");
const cron = require("node-cron");
const { spawn } = require("child_process");

/* -------------------------- ROUTES -------------------------- */
const {
  patientRouter,
  checkupRouter,
  visitRouter,
  legacyVisitsBlocker,
} = require("./modules/patients");
const { aiRouter } = require("./modules/ai");
const { ragRouter } = require("./modules/rag");
const { reportRouter, reportRenderRouter, pdfRouter } = require("./modules/reports");
const { speechRoutes } = require("./modules/speech");
const { authRouter } = require("./modules/auth/auth.routes");
const { usersRouter } = require("./modules/auth/users.routes");

/* -------------------------- CRON JOBS -------------------------- */
const migrationScriptVitals = path.resolve(__dirname, "scripts/patientMigration.js");
const migrationScriptVisits = path.resolve(__dirname, "scripts/visitMigration.js");
const embeddingsScript = path.resolve(__dirname, "scripts/embedAllPatients.js");

cron.schedule("0 0 * * *", () => {
  console.log(`🌙 [CRON] Running daily patient embeddings update: ${new Date().toISOString()}`);
  const proc = spawn("node", [embeddingsScript], { stdio: "inherit" });
  proc.on("close", (code) => console.log(`✅ [CRON] Embeddings update exited with code ${code}`));
});

// hourly vitals migration
cron.schedule("0 * * * *", () => {
  console.log(`⏰ [CRON] Running hourly vitals migration: ${new Date().toISOString()}`);
  const proc = spawn("node", [migrationScriptVitals], { stdio: "inherit" });
  proc.on("close", (code) => console.log(`✅ [CRON] Vitals migration exited with code ${code}`));
});

// hourly visit migration (10 min after)
cron.schedule("10 * * * *", () => {
  console.log(`⏰ [CRON] Running hourly visit migration: ${new Date().toISOString()}`);
  const proc = spawn("node", [migrationScriptVisits], { stdio: "inherit" });
  proc.on("close", (code) => console.log(`✅ [CRON] Visit migration exited with code ${code}`));
});

/* -------------------------- SERVER START -------------------------- */
(async function start() {
  try {
    const useInMemory = String(process.env.USE_IN_MEMORY || "").toLowerCase() === "true";
    let uri = process.env.MONGO_URI;

    if (useInMemory) {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log("[DB] Using in-memory MongoDB for development.");
    }

    if (!uri) throw new Error("MONGO_URI not set (or USE_IN_MEMORY=true not configured)");
    await connectToDB(uri);
    console.log("✅ DB connected to:", connection.name);

    const app = express();
    app.set("trust proxy", true);
    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(compression());

    // --- CORS ---
    const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || process.env.CLIENT_ORIGIN || "http://localhost:3000";
    console.log(`[CORS] Allowing origin: ${FRONTEND_ORIGIN}`);
    app.use(
      cors({
        origin: FRONTEND_ORIGIN,
        credentials: true,
      })
    );
    // Handle preflight for all routes (helpful when using credentials)
    app.options("*", cors({ origin: FRONTEND_ORIGIN, credentials: true }));

    // Parse
    app.use(cookieParser());
    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true }));

    // View engine for the HTML report preview
    app.engine("hbs", exphbs.engine({ extname: ".hbs" }));
    app.set("view engine", "hbs");
    app.set("views", path.join(__dirname, "views"));

    /* -------------------------- ROUTE MOUNTING -------------------------- */
    app.get("/healthz", (_req, res) => res.json({ ok: true, db: connection?.name || null }));
    app.get("/api/ping", (_req, res) => res.json({ ok: true })); // quick FE ping

    // Auth & Users
    app.use("/api/auth", authRouter);
    app.use("/api/users", usersRouter);

    // Core patients CRUD + AI/RAG
    app.use("/api/patients", patientRouter);
    app.use("/api/ai", aiRouter);
    app.use("/api/rag", ragRouter);
    app.use("/api/speech", speechRoutes);

    // Checkups (vitals): mount BOTH nested and legacy
    // - Nested: POST /api/patients/:patientId/checkups   (PatientForm uses this)
    // - Legacy: POST /api/checkups  { patient_id, vitals }  (curl/tools/backfill)
    app.use("/api/patients/:patientId/checkups", checkupRouter);
    app.use("/api/checkups", checkupRouter);

    // Visits: nested (and keep your legacy blocker at top-level)
    app.use("/api/patients/:patientId/visits", visitRouter);
    app.use("/api/visits", legacyVisitsBlocker);

    // Reporting + PDFs
    app.use("/api/reports", reportRouter);
    app.use("/reports", reportRenderRouter);
    app.use("/", pdfRouter);

    /* -------------------------- ERROR HANDLERS -------------------------- */
    app.use((req, res, next) => {
      if (res.headersSent) return next();
      res.status(404).json({ error: "Not found", path: req.originalUrl });
    });

    app.use((err, req, res, _next) => {
      console.error("Unhandled error:", err);
      res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
    });

    /* -------------------------- START SERVER -------------------------- */
    const port = process.env.PORT || 5001; // default to 5001 for clarity
    const server = app.listen(port, () => {
      console.log(`🚀 API running on http://localhost:${port}`);
    });

    for (const signal of ["SIGINT", "SIGTERM"]) {
      process.on(signal, async () => {
        console.log(`\n🛑 Received ${signal}, shutting down…`);
        try { await connection.close(); } catch {}
        server.close(() => process.exit(0));
      });
    }
  } catch (err) {
    console.error("\n[Startup] API failed to start:", err);
    process.exit(1);
  }
})();
