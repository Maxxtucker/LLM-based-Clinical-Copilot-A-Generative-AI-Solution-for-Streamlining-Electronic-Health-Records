// server/src/server.js
require("dotenv").config();

const mongoose = require("mongoose");
mongoose.set("debug", true);

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const { connectToDB } = require("./config/db");
const { connection } = require("mongoose");

// View engine for HTML report preview
const exphbs = require("express-handlebars");

// --- ROUTES (modules)
const checkupRoutes      = require("./routes/checkup_route");
const reportApiRoutes    = require("./routes/report_routes");
const reportRenderRoutes = require("./routes/report_render_routes");
const pdfRoutes          = require("./routes/pdf_routes");
const aiReportRoutes     = require("./routes/ai_report_routes");
const patientRoutes      = require("./routes/patient_route");
const ragRoutes          = require("./routes/rag");
const visitRoutes        = require("./routes/visit_routes");

// --- CRON setup ---
const cron = require("node-cron");
const { spawn } = require("child_process");

// DAILY MIGRATION FOR VITALS AND VISITS
// (1) Patient → Checkup migration (vitals) @ 7:00 PM SGT daily
const migrationScriptVitals = path.resolve(__dirname, "scripts/patientMigration.js");
cron.schedule("0 19 * * *", () => {
  console.log(`⏰ [CRON] Running daily vitals migration: ${new Date().toISOString()}`);
  const proc = spawn("node", [migrationScriptVitals], { stdio: "inherit" });
  proc.on("close", (code) => {
    console.log(`✅ [CRON] Vitals migration exited with code ${code}`);
  });
}, { timezone: "Asia/Singapore" });

// (2) Patient → Visit migration (clinical visits) @ 7:10 PM SGT daily
const migrationScriptVisits = path.resolve(__dirname, "scripts/visitMigration.js");
cron.schedule("10 19 * * *", () => {
  console.log(`⏰ [CRON] Running daily visit migration: ${new Date().toISOString()}`);
  const proc = spawn("node", [migrationScriptVisits], { stdio: "inherit" });
  proc.on("close", (code) => {
    console.log(`✅ [CRON] Visit migration exited with code ${code}`);
  });
}, { timezone: "Asia/Singapore" });


// Optional: run both immediately on startup for dev/testing
// spawn("node", [migrationScriptVitals, "--test"], { stdio: "inherit" });
// spawn("node", [migrationScriptVisits, "--test"], { stdio: "inherit" });


(async function start() {
  try {
    // ----------------------------
    // DB connection (Atlas or in-memory)
    // ----------------------------
    const useInMemory = String(process.env.USE_IN_MEMORY || "").toLowerCase() === "true";
    let uri = process.env.MONGO_URI;

    if (useInMemory) {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log("[DB] Using in-memory MongoDB for development. Data resets on restart.");
    }

    if (!uri) throw new Error("MONGO_URI not set (or USE_IN_MEMORY=true not configured)");

    await connectToDB(uri);
    console.log("✅ DB connected to:", connection.name);

    // ----------------------------
    // Build Express app + middleware
    // ----------------------------
    const app = express();
    app.set("trust proxy", true);
    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(compression());

    const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";
    app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true }));

    // View engine for the HTML report preview
    app.engine("hbs", exphbs.engine({ extname: ".hbs" }));
    app.set("view engine", "hbs");
    app.set("views", path.join(__dirname, "views"));

    // ----------------------------
    // Health check
    // ----------------------------
    app.get("/healthz", (_req, res) => res.json({ ok: true, db: connection?.name || null }));

    // ----------------------------
    // Mount routes
    // ----------------------------
    app.use("/api/checkups", checkupRoutes);
    app.use("/api/reports", reportApiRoutes);
    app.use("/reports", reportRenderRoutes);
    app.use("/", pdfRoutes);
    app.use("/api/ai", aiReportRoutes);
    app.use("/api/patients", patientRoutes);
    app.use("/api/rag", ragRoutes);
    app.use("/api/visits", visitRoutes);

    // 404 fallback
    app.use((req, res, next) => {
      if (res.headersSent) return next();
      res.status(404).json({ error: "Not found", path: req.originalUrl });
    });

    // Central error handler
    app.use((err, req, res, _next) => {
      console.error("Unhandled error:", err);
      res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
    });

    // ----------------------------
    // Start server
    // ----------------------------
    const port = process.env.PORT || 5000;
    const server = app.listen(port, () => {
      console.log(`API running on http://localhost:${port}`);
    });

    // Graceful shutdown
    for (const signal of ["SIGINT", "SIGTERM"]) {
      process.on(signal, async () => {
        console.log(`\n🛑 Received ${signal}, shutting down…`);
        try { await connection.close(); } catch {}
        server.close(() => process.exit(0));
      });
    }

  } catch (err) {
    console.error("\n[Startup] API failed to start.");
    console.error("Reason:", err?.message || err);
    console.error("Tips:");
    console.error("- If using MongoDB Atlas, whitelist your IP or allow 0.0.0.0/0 for testing.");
    console.error("- Verify MONGO_URI + credentials.");
    console.error("- Or set USE_IN_MEMORY=true in server/.env to run an in-memory DB for local dev.");
    process.exit(1);
  }
})();
